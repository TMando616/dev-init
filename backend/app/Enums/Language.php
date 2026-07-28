<?php

namespace App\Enums;

enum Language: string
{
    case Php = 'php';
    case Python = 'python';
    case Javascript = 'javascript';
    case Ruby = 'ruby';
    case Java = 'java';

    /** @return string[] */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
