<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Order;
use App\Models\StockItem;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LaporanController extends Controller
{
    /**
     * Tampilkan halaman laporan.
     */
    public function index()
    {
        return view('laporan.index', [
            'pageKey' => 'laporan',
        ]);
    }

    /**
     * Ambil data laporan terpadu:
     * - Pendapatan dari pesanan berstatus completed/lunas
     * - Pengeluaran dari tabel expenses
     * - Pendapatan Bersih = Total Pendapatan - Total Pengeluaran
     * - Pergerakan stok dari tabel stock_movements
     */
    public function data(Request $request): JsonResponse
    {
        $from = $request->input('from');
        $to   = $request->input('to');

        // 1. Ambil data pesanan yang SUDAH DIBAYAR/LUNAS (status = 'completed')
        $orderQuery = Order::with(['items.menu', 'payment'])
            ->where('status', 'completed')
            ->orderByDesc('order_date');

        if (! empty($from)) {
            $orderQuery->whereDate('order_date', '>=', $from);
        }
        if (! empty($to)) {
            $orderQuery->whereDate('order_date', '<=', $to);
        }

        $orders = $orderQuery->get();
        $totalPendapatan = (float) $orders->sum('total');

        $formattedOrders = $orders->map(function ($order) {
            return [
                'id'             => $order->id_order,
                'invoice_number' => $order->invoice_number,
                'date'           => Carbon::parse($order->order_date)->toIso8601String(),
                'formatted_date' => Carbon::parse($order->order_date)->translatedFormat('d/m/Y H:i'),
                'payment'        => $order->payment?->payment_method ?? 'tunai',
                'total'          => (float) $order->total,
                'customer_name'  => $order->customer_name ?? '-',
                'items'          => $order->items->map(fn ($i) => [
                    'name'  => $i->menu?->name ?? '-',
                    'qty'   => (int) $i->quantity,
                    'price' => (float) $i->price,
                ])->values(),
            ];
        });

        // 2. Ambil data PENGELUARAN dari tabel expenses
        $expenseQuery = Expense::query()->orderByDesc('expense_date');

        if (! empty($from)) {
            $expenseQuery->whereDate('expense_date', '>=', $from);
        }
        if (! empty($to)) {
            $expenseQuery->whereDate('expense_date', '<=', $to);
        }

        $expenses = $expenseQuery->get();
        $totalPengeluaran = (float) $expenses->sum('amount');

        $formattedExpenses = $expenses->map(function ($exp) {
            return [
                'id'             => $exp->id_expense,
                'expense_date'   => Carbon::parse($exp->expense_date)->format('Y-m-d'),
                'formatted_date' => Carbon::parse($exp->expense_date)->translatedFormat('d/m/Y'),
                'category'       => $exp->category,
                'description'    => $exp->description ?? '-',
                'amount'         => (float) $exp->amount,
            ];
        });

        // 3. Hitung Pendapatan Bersih = Total Pendapatan - Total Pengeluaran
        $pendapatanBersih = $totalPendapatan - $totalPengeluaran;

        // 4. Ambil data pergerakan stok untuk tab Stock
        $stockQuery = StockMovement::with(['stockItem', 'user'])
            ->orderByDesc('created_at');

        if (! empty($from)) {
            $stockQuery->whereDate('created_at', '>=', $from);
        }
        if (! empty($to)) {
            $stockQuery->whereDate('created_at', '<=', $to);
        }

        $stockMovements = $stockQuery->get()->map(function ($m) {
            return [
                'id'          => $m->id_stock_movements,
                'date'        => $m->created_at?->toIso8601String(),
                'item_name'   => $m->stockItem?->name ?? '-',
                'category'    => 'gudang',
                'type'        => $m->type,
                'qty'         => (int) $m->quantity,
                'unit'        => $m->stockItem?->unit ?? '-',
                'source'      => $m->source_type,
                'note'        => $m->description ?? '-',
                'user_name'   => $m->user?->name ?? '-',
            ];
        });

        return response()->json([
            'total_pendapatan'  => $totalPendapatan,
            'total_pengeluaran' => $totalPengeluaran,
            'pendapatan_bersih' => $pendapatanBersih,
            'orders'            => $formattedOrders,
            'expenses'          => $formattedExpenses,
            'stock_movements'   => $stockMovements,
        ]);
    }
}
