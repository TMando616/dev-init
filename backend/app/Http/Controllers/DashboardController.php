<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $service
    ) {}

    /**
     * Get dashboard data for the authenticated user.
     */
    public function index(Request $request)
    {
        return response()->json($this->service->getDashboardData($request->user()));
    }
}
