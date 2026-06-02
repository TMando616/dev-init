<?php

namespace Database\Factories;

use App\Models\Material;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Material>
 */
class MaterialFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title'       => fake()->sentence(4),
            'content'     => fake()->paragraphs(3, true),
            'category_id' => null,
            'order'       => fake()->numberBetween(0, 100),
        ];
    }
}
