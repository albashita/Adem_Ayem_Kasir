<?php

namespace App\Http\Controllers;

use App\Models\StockItem;
use App\Models\StockMovement;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
     * JSON: daftar seluruh bahan baku untuk tabel utama.
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
            'id' => $m->id_stock_movements,
            'date' => $m->created_at?->toIso8601String(),
            'item_name' => $m->stockItem?->name ?? '-',
            'unit' => $m->stockItem?->unit ?? '-',
            'type' => $m->type,
            'quantity' => $m->quantity,
            'source_type' => $m->source_type,
            'description' => $m->description ?? '',
            'user_name' => $m->user?->name ?? '-',
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
        if ($request->has('name')) {
            $request->merge(['name' => trim((string) $request->input('name'))]);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:35',
                Rule::unique('stock_items', 'name'),
            ],
            'unit' => 'required|in:gram,liter,pcs',
            'minimum_stock' => 'required|integer|min:0',
            'initial_stock' => 'required|integer|min:0',
            'description' => 'nullable|string|max:150',
        ], [
            'name.unique' => 'Nama bahan sudah terdaftar. Silakan gunakan nama bahan lain.',
            'name.required' => 'Nama bahan wajib diisi.',
            'name.max' => 'Nama bahan maksimal 35 karakter.',
        ]);

        try {
            $item = DB::transaction(function () use ($validated) {
                $item = StockItem::create([
                    'name' => $validated['name'],
                    'unit' => $validated['unit'],
                    'current_stock' => $validated['initial_stock'],
                    'minimum_stock' => $validated['minimum_stock'],
                    'description' => $validated['description'] ?? null,
                    'is_active' => true,
                ]);

                if ($validated['initial_stock'] > 0) {
                    StockMovement::create([
                        'type' => 'in',
                        'quantity' => $validated['initial_stock'],
                        'source_type' => 'purchase',
                        'description' => 'Stok awal',
                        'users_id_user' => Auth::id(),
                        'stock_items_id_stock_item' => $item->id_stock_item,
                    ]);
                }

                return $item;
            });

            return response()->json([
                'message' => 'Bahan baku berhasil ditambahkan.',
                'item' => $item,
            ], 201);
        } catch (QueryException $e) {
            if ($e->errorInfo[1] == 1062) {
                return response()->json([
                    'message' => 'Nama bahan sudah terdaftar. Silakan gunakan nama bahan lain.',
                    'errors' => [
                        'name' => ['Nama bahan sudah terdaftar. Silakan gunakan nama bahan lain.'],
                    ],
                ], 422);
            }
            throw $e;
        }
    }

    /**
     * Perbarui data bahan baku (nama, satuan, stok minimum, deskripsi).
     * Kuantitas stok tidak diubah di sini; gunakan stock-in / stock-out.
     */
    public function update(Request $request, StockItem $stockItem)
    {
        if ($request->has('name')) {
            $request->merge(['name' => trim((string) $request->input('name'))]);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:35',
                Rule::unique('stock_items', 'name')->ignore($stockItem->id_stock_item, 'id_stock_item'),
            ],
            'unit' => 'required|in:gram,liter,pcs',
            'minimum_stock' => 'required|integer|min:0',
            'description' => 'nullable|string|max:150',
        ], [
            'name.unique' => 'Nama bahan sudah terdaftar. Silakan gunakan nama bahan lain.',
            'name.required' => 'Nama bahan wajib diisi.',
            'name.max' => 'Nama bahan maksimal 35 karakter.',
        ]);

        try {
            $stockItem->update($validated);

            return response()->json([
                'message' => 'Bahan baku berhasil diperbarui.',
                'item' => $stockItem->fresh(),
            ]);
        } catch (QueryException $e) {
            if ($e->errorInfo[1] == 1062) {
                return response()->json([
                    'message' => 'Nama bahan sudah terdaftar. Silakan gunakan nama bahan lain.',
                    'errors' => [
                        'name' => ['Nama bahan sudah terdaftar. Silakan gunakan nama bahan lain.'],
                    ],
                ], 422);
            }
            throw $e;
        }
    }

    /**
     * Ubah status aktif/nonaktif bahan baku (via Switch toggle).
     */
    public function toggleStatus(Request $request, StockItem $stockItem)
    {
        $validated = $request->validate([
            'is_active' => 'nullable|boolean',
        ]);

        $newStatus = array_key_exists('is_active', $validated)
            ? (bool) $validated['is_active']
            : ! $stockItem->is_active;

        $stockItem->update(['is_active' => $newStatus]);

        return response()->json([
            'message' => $newStatus ? 'Bahan baku berhasil diaktifkan.' : 'Bahan baku berhasil dinonaktifkan.',
            'is_active' => (bool) $stockItem->is_active,
            'item' => $stockItem->fresh(),
        ]);
    }

    /**
     * Hapus bahan baku.
     *
     * Aturan:
     * - Bahan yang belum memiliki relasi apapun dapat dihapus secara permanen (hard delete).
     * - Bahan yang memiliki riwayat pergerakan stok (stock_movements) atau relasi resep (menu_ingredients)
     *   tidak boleh dihapus secara permanen agar relasi dan integritas data historis tidak rusak.
     * - Sebagai gantinya, bahan diarsipkan (soft delete via is_active = false) sehingga:
     *   1. Bahan tidak muncul kembali pada daftar bahan aktif.
     *   2. Riwayat pergerakan stok (stock_movements) tetap tersimpan utuh dan dapat ditampilkan.
     *   3. Foreign key database (RESTRICT) tidak terlanggar.
     */
    public function destroy(StockItem $stockItem): JsonResponse
    {
        $hasMovements = $stockItem->movements()->exists();
        $hasRecipe = $stockItem->menuIngredients()->exists();

        // Jika bahan memiliki riwayat pergerakan stok atau relasi resep, gunakan mekanisme arsip (is_active = false)
        if ($hasMovements || $hasRecipe) {
            $stockItem->update(['is_active' => false]);

            $reasons = [];
            if ($hasMovements) {
                $reasons[] = 'riwayat pergerakan stok';
            }
            if ($hasRecipe) {
                $reasons[] = 'resep menu';
            }
            $reasonText = implode(' dan ', $reasons);

            return response()->json([
                'status' => 'archived',
                'message' => "Bahan \"{$stockItem->name}\" berhasil dihapus dari daftar bahan aktif dan diarsipkan (karena memiliki {$reasonText} yang tetap tersimpan).",
            ]);
        }

        // Jika bahan belum memiliki relasi apapun, dapat dihapus permanen
        $stockItem->delete();

        return response()->json([
            'status' => 'deleted',
            'message' => "Bahan \"{$stockItem->name}\" berhasil dihapus secara permanen.",
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
            'quantity' => 'required|integer|min:1',
            'source_type' => 'required|in:purchase,harvest,gift,other',
            'description' => 'nullable|string|max:150',
        ]);

        DB::transaction(function () use ($validated, $stockItem) {
            $stockItem->increment('current_stock', $validated['quantity']);

            StockMovement::create([
                'type' => 'in',
                'quantity' => $validated['quantity'],
                'source_type' => $validated['source_type'],
                'description' => $validated['description'] ?? null,
                'users_id_user' => Auth::id(),
                'stock_items_id_stock_item' => $stockItem->id_stock_item,
            ]);
        });

        return response()->json([
            'message' => 'Stok berhasil ditambahkan.',
            'current_stock' => $stockItem->fresh()->current_stock,
        ]);
    }

    /**
     * Kurangi stok (terpakai/terjual, busuk/rusak, kadaluarsa, hilang, lainnya).
     * Body: quantity (int, min:1),
     *       source_type (used|spoiled|expired|lost|other),
     *       description (opsional, wajib jika source_type = other)
     */
    public function stockOut(Request $request, StockItem $stockItem)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'source_type' => 'required|in:used,spoiled,expired,lost,other',
            'description' => 'nullable|string|max:150|required_if:source_type,other',
        ], [
            'description.required_if' => 'Keterangan wajib diisi untuk alasan "Lainnya".',
        ]);

        try {
            DB::transaction(function () use ($validated, $stockItem) {
                // Kunci baris agar dua pengurangan bersamaan tidak membuat stok minus
                $item = StockItem::whereKey($stockItem->id_stock_item)->lockForUpdate()->first();

                if ($item->current_stock < $validated['quantity']) {
                    throw new \RuntimeException(
                        'Stok tidak mencukupi. Stok saat ini: '.$item->current_stock.' '.$item->unit.'.'
                    );
                }

                $item->decrement('current_stock', $validated['quantity']);

                StockMovement::create([
                    'type' => 'out',
                    'quantity' => $validated['quantity'],
                    'source_type' => $validated['source_type'],
                    'description' => $validated['description'] ?? null,
                    'users_id_user' => Auth::id(),
                    'stock_items_id_stock_item' => $item->id_stock_item,
                ]);
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Stok berhasil dikurangi.',
            'current_stock' => $stockItem->fresh()->current_stock,
        ]);
    }
}