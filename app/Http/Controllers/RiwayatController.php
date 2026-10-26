<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class RiwayatController extends Controller
{
    public function index()
    {
        return view('riwayat.index');
    }

    public function data()
    {
        $orders = Order::with('items')->latest()->get()->map(fn ($o) => [
            'id'             => $o->id,
            'no'             => $o->no,
            'date'           => $o->created_at->toIso8601String(),
            'customer'       => $o->customer,
            'service_type'   => $o->service_type,     // 'dinein' | 'takeaway'
            'status'         => $o->status,           // 'pending' | 'completed' | 'cancelled'
            'payment_method' => $o->payment_method,   // 'cash' | 'qris' | 'transfer' | null
            'subtotal'       => (int) $o->subtotal,
            'discount'       => (int) $o->discount,
            'tax'            => (int) $o->tax,
            'total'          => (int) $o->total,
            'received'       => $o->received,
            'change'         => $o->change_amount,
            'items'          => $o->items->map(fn ($i) => [
                'name'  => $i->name,
                'price' => (int) $i->price,
                'qty'   => (int) $i->qty,
            ])->values(),
        ]);

        return response()->json($orders);
    }

    public function pay(Request $request, Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Pesanan ini sudah diproses.'], 422);
        }

        $data = $request->validate([
            'payment_method' => 'required|in:cash,qris,transfer',
            'received'       => 'nullable|numeric|min:0',
        ]);

        $received = null;
        $change   = 0;

        if ($data['payment_method'] === 'cash') {
            $received = (int) ($data['received'] ?? 0);
            if ($received < $order->total) {
                return response()->json(['message' => 'Uang diterima kurang dari total.'], 422);
            }
            $change = $received - $order->total;
        }

        $order->update([
            'status'         => 'completed',
            'payment_method' => $data['payment_method'],
            'received'       => $received,
            'change_amount'  => $change,
            'paid_at'        => now(),
        ]);

        return response()->json(['message' => 'Pembayaran berhasil.', 'change' => $change]);
    }
}