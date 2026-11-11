<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Order;
use App\Models\StockItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private const METHOD_LABELS = [
        'cash'     => 'Tunai',
        'qris'     => 'QRIS',
        'transfer' => 'Transfer Bank',
    ];

    public function index()
    {
        $isAdmin = auth()->user()->role === 'admin';
        $today = Carbon::today();

        $periods = [
            'today' => [$today->copy()->startOfDay(), $today->copy()->endOfDay()],
            'w'     => [$today->copy()->subDays(6)->startOfDay(), $today->copy()->endOfDay()],
            'm'     => [$today->copy()->startOfMonth(), $today->copy()->endOfDay()],
        ];

        $stats = [];
        foreach ($periods as $key => [$start, $end]) {
            $stats[$key] = $isAdmin
                ? $this->adminPeriod($start, $end)
                : $this->ownerPeriod($start, $end);
        }

        return view('dashboard.index', [
            'pageKey'    => 'dashboard',
            'isAdmin'    => $isAdmin,
            'stats'      => $stats,
            'chart'      => $this->chart7Days(),
            'lowStock'   => $this->lowStock(),
            'stockCount' => StockItem::where('is_active', true)->count(),
            'feed'       => $isAdmin ? $this->movements(8) : $this->activity(),
        ]);
    }

    /* ------------------------------------------------------------ OWNER */

    private function ownerPeriod(Carbon $s, Carbon $e): array
    {
        [$ps, $pe] = $this->previousRange($s, $e);

        $income  = $this->income($s, $e);
        $expense = $this->expense($s, $e);

        $pending = Order::where('status', 'pending')->whereBetween('order_date', [$s, $e]);

        return [
            'income'       => $income,
            'expense'      => $expense,
            'net'          => $income - $expense,
            'trx'          => Order::where('status', 'completed')->whereBetween('order_date', [$s, $e])->count(),
            'pending'      => (clone $pending)->count(),
            'pendingTotal' => (float) (clone $pending)->sum('total'),
            'prevIncome'   => $this->income($ps, $pe),
            'prevExpense'  => $this->expense($ps, $pe),
            'methods'      => $this->paymentMethods($s, $e),
            'best'         => $this->bestSellers($s, $e),
        ];
    }

    private function paymentMethods(Carbon $s, Carbon $e): array
    {
        $rows = DB::table('payments')
            ->whereBetween('paid_at', [$s, $e])
            ->selectRaw('LOWER(payment_method) as m, COUNT(*) as c, SUM(amount) as t')
            ->groupBy('m')
            ->get()
            ->keyBy('m');

        $result = [];
        foreach (self::METHOD_LABELS as $key => $label) {
            $result[] = [
                'label' => $label,
                'count' => (int) ($rows[$key]->c ?? 0),
                'total' => (float) ($rows[$key]->t ?? 0),
            ];
        }

        // metode lain yang tidak dikenal tetap ditampilkan
        foreach ($rows as $key => $row) {
            if (! isset(self::METHOD_LABELS[$key])) {
                $result[] = ['label' => ucfirst($key), 'count' => (int) $row->c, 'total' => (float) $row->t];
            }
        }

        return $result;
    }

    private function bestSellers(Carbon $s, Carbon $e): array
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id_order', '=', 'order_items.orders_id_order')
            ->join('menus', 'menus.id_menu', '=', 'order_items.menus_id_menu')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.order_date', [$s, $e])
            ->selectRaw('menus.name, SUM(order_items.quantity) as qty')
            ->groupBy('menus.id_menu', 'menus.name')
            ->orderByDesc('qty')
            ->limit(5)
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'qty' => (int) $r->qty])
            ->all();
    }

    private function activity(): array
    {
        $moves = collect($this->movements(5))->map(fn ($m) => [
            'title' => ($m['type'] === 'in' ? 'Stok masuk: ' : 'Stok keluar: ') . $m['name'] . ' ' . $m['qty'] . ' ' . $m['unit'],
            'sub'   => $m['desc'],
            'time'  => $m['time'],
            'at'    => $m['at'],
        ]);

        $expenses = Expense::orderByDesc('created_at')->limit(3)->get()->map(fn ($x) => [
            'title' => 'Pengeluaran Rp ' . number_format($x->amount, 0, ',', '.'),
            'sub'   => trim($x->category . ($x->description ? ' · ' . $x->description : '')),
            'time'  => Carbon::parse($x->created_at)->locale('id')->diffForHumans(),
            'at'    => Carbon::parse($x->created_at)->toIso8601String(),
        ]);

        return $moves->concat($expenses)->sortByDesc('at')->take(6)->values()->all();
    }

    /* ------------------------------------------------------------ ADMIN */

    private function adminPeriod(Carbon $s, Carbon $e): array
    {
        $mv = DB::table('stock_movements')->whereBetween('created_at', [$s, $e]);
        $buy = Expense::where('category', 'Bahan Baku')
            ->whereBetween('expense_date', [$s->toDateString(), $e->toDateString()]);

        $byCategory = Expense::whereBetween('expense_date', [$s->toDateString(), $e->toDateString()])
            ->selectRaw('category, SUM(amount) as t')
            ->groupBy('category')
            ->orderByDesc('t')
            ->get()
            ->map(fn ($r) => ['label' => $r->category ?: 'Lainnya', 'total' => (float) $r->t])
            ->all();

        return [
            'masuk'      => (clone $mv)->where('type', 'in')->count(),
            'keluar'     => (clone $mv)->where('type', 'out')->count(),
            'buyTotal'   => (float) (clone $buy)->sum('amount'),
            'buyCount'   => (clone $buy)->count(),
            'spend'      => $this->expense($s, $e),
            'byCategory' => $byCategory,
        ];
    }

    private function movements(int $limit): array
    {
        return DB::table('stock_movements as m')
            ->join('stock_items as s', 's.id_stock_item', '=', 'm.stock_items_id_stock_item')
            ->orderByDesc('m.created_at')
            ->limit($limit)
            ->get(['m.type', 'm.quantity', 'm.source_type', 'm.description', 'm.created_at', 's.name', 's.unit'])
            ->map(fn ($r) => [
                'type' => $r->type,
                'name' => $r->name,
                'qty'  => (float) $r->quantity,
                'unit' => $r->unit,
                'desc' => $r->description ?: ucfirst($r->source_type),
                'time' => Carbon::parse($r->created_at)->locale('id')->diffForHumans(),
                'at'   => Carbon::parse($r->created_at)->toIso8601String(),
            ])
            ->all();
    }

    /* ----------------------------------------------------------- SHARED */

    private function lowStock(): array
    {
        return StockItem::where('is_active', true)
            ->whereColumn('current_stock', '<=', 'minimum_stock')
            ->orderBy('current_stock')
            ->get()
            ->map(fn ($i) => [
                'name' => $i->name,
                'unit' => $i->unit,
                'cur'  => (float) $i->current_stock,
                'min'  => (float) $i->minimum_stock,
            ])
            ->all();
    }

    private function chart7Days(): array
    {
        $names = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        $out = ['days' => [], 'income' => [], 'expense' => []];

        for ($i = 6; $i >= 0; $i--) {
            $d = Carbon::today()->subDays($i);
            $out['days'][]    = $names[(int) $d->dayOfWeek];
            $out['income'][]  = $this->income($d->copy()->startOfDay(), $d->copy()->endOfDay());
            $out['expense'][] = $this->expense($d->copy()->startOfDay(), $d->copy()->endOfDay());
        }

        return $out;
    }

    private function income(Carbon $s, Carbon $e): float
    {
        return (float) Order::where('status', 'completed')->whereBetween('order_date', [$s, $e])->sum('total');
    }

    private function expense(Carbon $s, Carbon $e): float
    {
        return (float) Expense::whereBetween('expense_date', [$s->toDateString(), $e->toDateString()])->sum('amount');
    }

    private function previousRange(Carbon $s, Carbon $e): array
    {
        $len = (int) floor($s->diffInDays($e)) + 1;

        return [$s->copy()->subDays($len), $s->copy()->subDay()->endOfDay()];
    }
}