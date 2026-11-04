<?php

namespace App\Http\Controllers;

use App\Models\Order;

class ReceiptController extends Controller
{
    public function show(string $token)
    {
        $order = Order::with(['items.menu', 'payment'])
            ->where('receipt_token', $token)
            ->where('status', 'completed')
            ->firstOrFail();

        return view('receipt.show', ['order' => $order]);
    }
}