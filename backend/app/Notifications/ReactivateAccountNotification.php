<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReactivateAccountNotification extends Notification
{
    /**
     * The plain token. Readable so tests can follow the link the recipient
     * would click; only its hash is persisted.
     */
    public function __construct(public readonly string $token) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = config('app.frontend_url') . '/reactivate?token=' . $this->token
            . '&email=' . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('【DevInit】アカウント復元のご案内')
            ->line('退会済みのメールアドレスで登録のリクエストを受け付けました。')
            ->line('以下のリンクからアカウントを復元すると、退会前の学習進捗をそのまま引き継げます。')
            ->action('アカウントを復元する', $url)
            ->line('このリンクの有効期限は60分です。')
            ->line('お名前は退会前のまま復元されます。変更したい場合は、ログイン後に設定画面から変更してください。')
            ->line('心当たりがない場合は、このメールを破棄してください。');
    }
}
