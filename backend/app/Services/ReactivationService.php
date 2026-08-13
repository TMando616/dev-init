<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\ReactivateAccountNotification;
use App\Repositories\ReactivationTokenRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ReactivationService
{
    public function __construct(
        protected UserRepository $users,
        protected ReactivationTokenRepository $tokens,
    ) {}

    /**
     * Decide what a registration attempt means. Collisions with an active
     * account are already rejected by RegisterRequest, so only "unregistered"
     * or "withdrawn" reach here. Returning null tells the caller to answer
     * with the 202 guidance message instead of issuing a token.
     *
     * @param  array{name: string, email: string, password: string}  $data
     */
    public function resolveRegistration(array $data): ?User
    {
        $trashed = $this->users->findTrashedByEmail($data['email']);

        if ($trashed && $this->isWithinRetention($trashed)) {
            $this->sendReactivationLink($trashed);

            return null;
        }

        // A withdrawn record past its retention period may still be waiting
        // for the purge command. Release its email address here so the person
        // is not blocked by a row that is already due for deletion.
        $trashed?->forceDelete();

        return $this->users->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
    }

    /**
     * Restore a withdrawn account and set the password chosen on the
     * reactivation screen. The name is deliberately left as it was: the
     * registration form was filled in by someone who had not yet proven
     * control of the mailbox.
     *
     * @param  array{token: string, email: string, password: string}  $data
     */
    public function reactivate(array $data): void
    {
        $user = $this->users->findTrashedByEmail($data['email']);

        if (! $user || ! $this->isWithinRetention($user)) {
            $this->failInvalidToken();
        }

        $record = $this->tokens->findByEmail($data['email']);

        if (! $record || $this->isExpired($record) || ! Hash::check($data['token'], $record->token)) {
            $this->failInvalidToken();
        }

        $this->users->restore($user);
        $user->forceFill(['password' => $data['password']])->save();

        // Single use: the row is gone, so replaying the same link fails above.
        $this->tokens->delete($data['email']);
    }

    /**
     * Issue a fresh token and mail the reactivation link. Only the hash is
     * stored; the plain value never touches the database.
     */
    protected function sendReactivationLink(User $user): void
    {
        $token = Str::random(64);

        $this->tokens->create($user->email, Hash::make($token));

        $user->notify(new ReactivateAccountNotification($token));
    }

    /**
     * Whether the account is still inside the retention window. The boundary
     * matches PurgeDeletedUsers, which deletes records older than it.
     */
    protected function isWithinRetention(User $user): bool
    {
        return $user->deleted_at->gte(
            now()->subDays(config('account.retention_days'))
        );
    }

    protected function isExpired(object $record): bool
    {
        return Carbon::parse($record->created_at)
            ->addMinutes(config('account.reactivation_token_expire'))
            ->isPast();
    }

    /**
     * One message for every failure mode (missing, expired, already used,
     * past retention) so the response never reveals which applied.
     */
    protected function failInvalidToken(): never
    {
        throw ValidationException::withMessages([
            'email' => ['この復元リンクは無効か、有効期限が切れています。'],
        ]);
    }
}
