<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CodeExecutionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /**
     * Test PHP code execution.
     */
    public function test_can_execute_php_code(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/execute', [
            'language' => 'php',
            'code' => '<?php echo "Hello from PHP";'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'stdout' => 'Hello from PHP',
            ]);
    }

    /**
     * Test Python code execution.
     */
    public function test_can_execute_python_code(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/execute', [
            'language' => 'python',
            'code' => 'print("Hello from Python")'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'stdout' => "Hello from Python\n",
            ]);
    }

    /**
     * Test JavaScript code execution.
     */
    public function test_can_execute_javascript_code(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/execute', [
            'language' => 'javascript',
            'code' => 'console.log("Hello from JavaScript")'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'stdout' => "Hello from JavaScript\n",
            ]);
    }

    /**
     * Test unsupported language.
     */
    public function test_returns_error_for_unsupported_language(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/execute', [
            'language' => 'cplusplus',
            'code' => 'std::cout << "Hello";'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'error',
                'stderr' => 'Unsupported language: cplusplus',
            ]);
    }

    /**
     * Test code execution timeout.
     */
    public function test_handles_execution_timeout(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/execute', [
            'language' => 'php',
            'code' => '<?php while(true);'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'timeout',
            ]);
    }
}
