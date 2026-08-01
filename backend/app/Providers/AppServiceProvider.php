<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Named rate limiters applied to the API routes (see routes/api.php).
     */
    protected function configureRateLimiting(): void
    {
        // Login / registration: keyed by IP + email so brute force on a single
        // account is throttled without locking out a whole shared network.
        RateLimiter::for('auth', function (Request $request) {
            $key = $request->ip() . '|' . strtolower((string) $request->input('email'));

            return Limit::perMinute(6)->by($key);
        });

        // Code execution: each request spends one Docker container and up to 5s.
        RateLimiter::for('execute', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()->id);
        });

        // Dedicated budget so the editor's 2s-debounced autosave
        // (30 req/min at worst) is never blocked by other API calls.
        RateLimiter::for('submissions', function (Request $request) {
            return Limit::perMinute(40)->by($request->user()->id);
        });

        // Default for every other authenticated endpoint.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()->id);
        });
    }
}
