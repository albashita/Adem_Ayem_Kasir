<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Order;
use App\Models\StockItem;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $startOfWeek = Carbon::today()->subDays(6)->startOfDay();
        $startOfMonth = Carbon::today()->startOfMonth();

        // 1. Data Owner (Hari ini, 7 hari, Bulan ini)
        $ownerStats = [
            'today' => $this->calcFinancialPeriod($today->copy()->startOfDay(), $today->copy()->endOfDay()),
            'w'     => $this->calcFinancialPeriod($startOfWeek, Carbon::today()->endOfDay()),
            'm'     => $this->calcFinancialPeriod($startOfMonth, Carbon::today()->endOfDay()),
        ];

        // 2. Chart 7 hari terakhir (Pemasukan vs Pengeluaran)
        $chartDays = [];
        $chartIncome = [];
        $chartExpense = [];

        $dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayOfWeek = (int) $date->dayOfWeek; // 0 (Sun) to 6 (Sat)
            $chartDays[] = $dayNames[$dayOfWeek];

            $inc = (float) Order::where('status', 'completed')
                ->whereDate('order_date', $date->toDateString())
                ->sum('total');

            $exp = (float) Expense::whereDate('expense_date', $date->toDateString())
                ->sum('amount');

            $chartIncome[] = $inc;
            $chartExpense[] = $exp;
        }

        // 3. Data Admin (Stok menipis, barang masuk, pembelian, barang keluar)
        $lowStockItems = StockItem::where('is_active', true)
            ->whereColumn('current_stock', '<=', 'minimum_stock')
            ->orderBy('current_stock')
            ->get();

        $adminStats = [
            'today' => $this->calcAdminStockPeriod($today->copy()->startOfDay(), $today->copy()->endOfDay()),
            'w'     => $this->calcAdminStockPeriod($startOfWeek, Carbon::today()->endOfDay()),
            'm'     => $this->calcAdminStockPeriod($startOfMonth, Carbon::today()->endOfDay()),
        ];

        return view('dashboard.index', [
            'pageKey'      => 'dashboard',
            'ownerStats'   => $ownerStats,
            'chartDays'    => $chartDays,
            'chartIncome'  => $chartIncome,
            'chartExpense' => $chartExpense,
            'lowStockItems' => $lowStockItems,
            'adminStats'   => $adminStats,
        ]);
    }

    private function calcFinancialPeriod(Carbon $start, Carbon $end): array
    {
        $orders = Order::where('status', 'completed')
            ->whereBetween('order_date', [$start, $end])
            ->get();

        $income = (float) $orders->sum('total');
        $trxCount = $orders->count();

        $expense = (float) Expense::whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount');

        $pendingOrders = Order::where('status', 'pending')
            ->whereBetween('order_date', [$start, $end])
            ->get();

        $pendingCount = $pendingOrders->count();
        $pendingTotal = (float) $pendingOrders->sum('total');

        return [
            'income'       => $income,
            'expense'      => $expense,
            'net_income'   => $income - $expense,
            'trx'          => $trxCount,
            'pending'      => $pendingCount,
            'pendingTotal' => $pendingTotal,
        ];
    }

    private function calcAdminStockPeriod(Carbon $start, Carbon $end): array
    {
        $movements = StockMovement::whereBetween('created_at', [$start, $end])->get();
        $masuk = $movements->where('type', 'in')->count();
        $keluar = $movements->where('type', 'out')->count();

        // Pembelian dari pengeluaran kategori 'Bahan Baku'
        $buyTotal = (float) Expense::where('category', 'Bahan Baku')
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount');

        $buyCount = Expense::where('category', 'Bahan Baku')
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->count();

        return [
            'buyTotal' => $buyTotal,
            'buyCount' => $buyCount,
            'masuk'    => $masuk,
            'keluar'   => $keluar,
        ];
    }
}
