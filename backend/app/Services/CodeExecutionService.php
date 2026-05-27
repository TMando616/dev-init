<?php

namespace App\Services;

use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;

class CodeExecutionService
{
    protected const TIMEOUT = 5; // seconds
    protected const MEMORY_LIMIT = '128m';

    /**
     * Supported languages and their docker configurations
     */
    protected array $languages = [
        'php' => [
            'image' => 'php:8.4-cli-alpine',
            'command' => ['php', '-d', 'display_errors=On'],
            'extension' => 'php',
        ],
        'python' => [
            'image' => 'python:3.12-alpine',
            'command' => ['python'],
            'extension' => 'py',
        ],
        'javascript' => [
            'image' => 'node:22-alpine',
            'command' => ['node'],
            'extension' => 'js',
        ],
        'ruby' => [
            'image' => 'ruby:3.3-alpine',
            'command' => ['ruby'],
            'extension' => 'rb',
        ],
        'java' => [
            'image' => 'amazoncorretto:21-alpine',
            'command' => ['java'],
            'extension' => 'java',
        ],
    ];

    /**
     * Execute the given code in a isolated Docker container.
     */
    public function execute(string $language, string $code): array
    {
        if (!isset($this->languages[$language])) {
            return [
                'status' => 'error',
                'stdout' => '',
                'stderr' => "Unsupported language: {$language}",
                'execution_time_ms' => 0,
            ];
        }

        $config = $this->languages[$language];
        $tempDir = storage_path('app/temp_code');
        if (!File::exists($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }

        $fileName = Str::random(10) . '.' . $config['extension'];
        $filePath = $tempDir . '/' . $fileName;

        // Ensure PHP code has opening tag if missing, but be careful with existing ones
        if ($language === 'php' && !str_contains($code, '<?php')) {
            $code = "<?php\n" . $code;
        }

        File::put($filePath, $code);

        // We need the host path for Docker volume mounting.
        // If we're running inside Docker (like in local dev), the container's path (/var/www/backend)
        // doesn't match the host's path. We use DOCKER_HOST_PATH to bridge this.
        // In CI or environments where we run directly on the host, storage_path() is sufficient.
        $hostBasePath = env('DOCKER_HOST_PATH', storage_path('app/temp_code'));
        $hostPath = rtrim($hostBasePath, '/') . '/' . $fileName;

        // Docker command construction
        $dockerCommand = [
            'docker', 'run', '--rm',
            '--network', 'none',
            '--memory', self::MEMORY_LIMIT,
            '--read-only',
            '-v', "{$hostPath}:/tmp/code.{$config['extension']}:ro",
            $config['image'],
            ...$config['command'], "/tmp/code.{$config['extension']}"
        ];

        $process = new Process($dockerCommand);
        $process->setTimeout(self::TIMEOUT);

        $start = microtime(true);
        try {
            $process->run();
            $end = microtime(true);
            $executionTimeMs = round(($end - $start) * 1000);

            return [
                'status' => $process->isSuccessful() ? 'success' : 'error',
                'stdout' => $process->getOutput(),
                'stderr' => $process->getErrorOutput(),
                'execution_time_ms' => $executionTimeMs,
            ];
        } catch (ProcessTimedOutException $e) {
            return [
                'status' => 'timeout',
                'stdout' => $process->getOutput(),
                'stderr' => "Execution timed out after " . self::TIMEOUT . " seconds.",
                'execution_time_ms' => self::TIMEOUT * 1000,
            ];
        } catch (\Exception $e) {
            Log::error('Code execution failed: ' . $e->getMessage());
            return [
                'status' => 'error',
                'stdout' => '',
                'stderr' => 'An internal error occurred during execution.',
                'execution_time_ms' => 0,
            ];
        } finally {
            if (File::exists($filePath)) {
                File::delete($filePath);
            }
        }
    }
}
