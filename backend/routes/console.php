<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// 保持期間を過ぎた退会済みアカウントの物理削除。利用の少ない時間帯に回し、
// 実行が長引いたときに翌日分と重ならないようにする。
Schedule::command('users:purge-deleted')
    ->dailyAt('03:00')
    ->withoutOverlapping();
