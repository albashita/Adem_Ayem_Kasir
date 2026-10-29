<?php

namespace App\Http\Controllers;

use App\Models\StockItem;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockItemController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Halaman & Data
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        return view('stok.index', [
            'pageKey' => 'stok',
        ]);
    }

    /**
     * JSON: daftar bahan baku aktif untuk tabel utama.
     */
    public function data()
    {
        $items = StockItem::where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json($items);
    }

    /**
     * JSON: riwayat pergerakan stok dengan filter tanggal opsional.
     * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
     */
    public function movements(Request $request)
    {
        $query = StockMovement::with(['stockItem', 'user'])
            ->orderByDesc('created_at')
            ->limit(500);

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->input('to'));
        }

        $movements = $query->get()->map(fn ($m) => [
            'id'          => $m->id_stock_movements,
            'date'        => $m->created_at?->toIso8601String(),
            'item_name'   => $m->stockItem?->name ?? '-',
            'unit'        => $m->stockItem?->unit ?? '-',
            'type'        => $m->type,
            'quantity'    => $m->quantity,
            'source_type' => $m->source_type,
            'description' => $m->description ?? '',
            'user_name'   => $m->user?->name ?? '-',
        ]);

        return response()->json($movements);
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD Bahan Baku
    |--------------------------------------------------------------------------
    */

    /**
     * Tambah bahan baku baru beserta stok awal (opsional).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:35',
            'unit'          => 'required|string|max:15',
            'minimum_stock' => 'required|integer|min:0',
            'initial_stock' => 'required|integer|min:0',
            'description'   => 'nullable|string|max:150',
        ]);

        $item = DB::transaction(function () use ($validated) {
            $item = StockItem::create([
                'name'          => $validated['name'],
                'unit'          => $validated['unit'],
                'current_stock' => $validated['initial_stock'],
                'minimum_stock' => $validated['minimum_stock'],
                'description'   => $validated['description'] ?? null,
                'is_active'     => true,
            ]);

            if ($validated['initial_stock'] > 0) {
                StockMovement::create([
                    'type'                     => 'in',
                    'quantity'                 => $validated['initial_stock'],
                    'source_type'              => 'purchase',
                    'description'              => 'Stok awal',
                    'users_id_user'            => Auth::id(),
                    'stock_items_id_stock_item' => $item->id_stock_item,
                ]);
            }

            return $item;
        });

        return response()->json([
            'message' => 'Bahan baku berhasil ditambahkan.',
            'item'    => $item,
        ], 201);
    }

    /**
     * Perbarui data bahan baku (nama, satuan, stok minimum, deskripsi).
     * Kuantitas stok tidak diubah di sini; gunakan stock-in / stock-out.
     */
    public function update(Request $request, StockItem $stockItem)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:35',
            'unit'          => 'required|string|max:15',
            'minimum_stock' => 'required|integer|min:0',
            'description'   => 'nullable|string|max:150',
        ]);

        $stockItem->update($validated);

        return response()->json([
            'message' => 'Bahan baku berhasil diperbarui.',
            'item'    => $stockItem->fresh(),
        ]);
    }

    /**
     * Nonaktifkan bahan baku (soft-deactivate).
     * Data tidak dihapus agar relasi resep/pergerakan tetap utuh.
     */
    public function destroy(StockItem $stockItem)
    {
        $stockItem->update(['is_active' => false]);

        return response()->json([
            'message' => 'Bahan baku berhasil dinonaktifkan.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Pergerakan Stok
    |--------------------------------------------------------------------------
    */

    /**
     * Tambah stok masuk.
     * Body: quantity (int, min:1), source_type (purchase|harvest|gift|other), description (opsional)
     */
    public function stockIn(Request $request, StockItem $stockItem)
    {
        $validated = $request->validate([
            'quantity'    => 'required|integer|min:1',
            'source_type' => 'required|in:purchase,harvest,gift,other',
            'description' => 'nullable|string|max:150',
        ]);

        DB::transaction(function () use ($validated, $stockItem) {
            $stockItem->increment('current_stock', $validated['quantity']);

            StockMovement::create([
                'type'                     => 'in',
                'quantity'                 => $validated['quantity'],
                'source_type'              => $validated['source_type'],
                'description'              => $validated['description'] ?? null,
                'users_id_user'            => Auth::id(),
                'stock_items_id_stock_item' => $stockItem->id_stock_item,
            ]);
        });

        return response()->json([
            'message'       => 'Stok berhasil ditambahkan.',
            'current_stock' => $stockItem->fresh()->current_stock,
        ]);
    }

    /**
     * Kurangi stok (stok keluar / koreksi).
     * Body: quantity (int, min:1), description (opsional)
     */
    public function stockOut(Request $request, StockItem $stockItem)
    {
        $validated = $request->validate([
            'quantity'    => 'required|integer|min:1',
            'description' => 'nullable|string|max:150',
        ]);

        if ($stockItem->current_stock < $validated['quantity']) {
            return response()->json([
                'message' => 'Stok tidak mencukupi. Stok saat ini: ' . $stockItem->current_stock . ' ' . $stockItem->unit . '.',
            ], 422);
        }

        DB::transaction(function () use ($validated, $stockItem) {
            $stockItem->decrement('current_stock', $validated['quantity']);

            StockMovement::create([
                'type'                     => 'out',
                'quantity'                 => $validated['quantity'],
                'source_type'              => 'other',
                'description'              => $validated['description'] ?? 'Koreksi stok',
                'users_id_user'            => Auth::id(),
                'stock_items_id_stock_item' => $stockItem->id_stock_item,
            ]);
        });

        return response()->json([
            'message'       => 'Stok berhasil dikurangi.',
            'current_stock' => $stockItem->fresh()->current_stock,
        ]);
    }
}
