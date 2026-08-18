<?php

namespace App\Console\Commands;

use App\Repositories\PasswordResetTokenRepository;
use App\Repositories\ReactivationTokenRepository;
use App\Repositories\UserRepository;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PurgeDeletedUsers extends Command
{
    protected $signature = 'users:purge-deleted
                            {--days= : 保持日数（未指定なら config/account.php の retention_days）}
                            {--dry-run : 削除せず対象だけを表示する}';

    protected $description = '保持期間を過ぎた退会済みユーザーを完全に削除する';

    public function handle(
        UserRepository $users,
        ReactivationTokenRepository $tokens,
        PasswordResetTokenRepository $resetTokens,
    ): int
    {
        $days = (int) ($this->option('days') ?? config('account.retention_days'));

        // ReactivationService の保持期間判定と同じ境界。ここで消える時点で
        // 復会もできなくなるよう、両者が同じ閾値を見るようにしてある。
        $targets = $users->trashedOlderThan(now()->subDays($days));
        $count = $targets->count();

        if ($this->option('dry-run')) {
            $this->info("[dry-run] 保持期間({$days}日)を過ぎた退会済みユーザー: {$count} 件");

            foreach ($targets as $user) {
                $this->line("  - {$user->email}（退会日: {$user->deleted_at->toDateTimeString()}）");
            }

            return self::SUCCESS;
        }

        foreach ($targets as $user) {
            // 未使用の復会トークン・リセットトークンが残っていることがあるため
            // 先に片付ける。どちらも users への外部キーを持たないので連鎖削除
            // されず、メールアドレスだけが残ってしまう。
            $tokens->delete($user->email);
            $resetTokens->delete($user->email);

            // submissions は cascadeOnDelete で一緒に消える。
            $users->forceDelete($user);
        }

        Log::info('Purged deleted users', ['count' => $count, 'days' => $days]);

        $this->info("保持期間({$days}日)を過ぎた退会済みユーザーを {$count} 件削除しました。");

        return self::SUCCESS;
    }
}
