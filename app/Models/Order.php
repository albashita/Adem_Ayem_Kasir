<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';
    protected $primaryKey = 'id_order';

    protected $fillable = [
        'invoice_number',
        'order_date',
        'subtotal',
        'discount',
        'tax',
        'total',
        'status',
        'customer_name',
        'order_type',
        'service_type',
        'receipt_token',
        'users_id_user',
    ];

    protected static function booted(): void
    {
        static::creating(function ($order) {
            $order->receipt_token = $order->receipt_token ?: \Illuminate\Support\Str::random(16);
        });
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'orders_id_order', 'id_order');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'orders_id_order', 'id_order');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'users_id_user', 'id_user');
    }
}