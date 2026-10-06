<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UmkmProduct;
use Illuminate\Http\Request;

class UmkmController extends Controller
{
    /**
     * List UMKM Products
     */
    public function index(Request $request)
    {
        $query = UmkmProduct::with('user.house')->where('is_active', true);

        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $products = $query->latest()->paginate(16);

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Store New UMKM Product (Warga)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:50',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'whatsapp_phone' => 'required|string|max:25',
            'photo' => 'nullable|image|max:5120',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('umkm_products', 'public');
            $photoPath = '/storage/' . $path;
        }

        // Format WA link cleanly
        $cleanPhone = preg_replace('/[^0-9]/', '', $validated['whatsapp_phone']);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '62' . substr($cleanPhone, 1);
        }
        $encodedMsg = urlencode("Halo, saya tertarik dengan produk {$validated['name']} di etalase SMART-WARGA.");
        $waLink = "https://wa.me/{$cleanPhone}?text={$encodedMsg}";

        $product = UmkmProduct::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'photo_path' => $photoPath,
            'whatsapp_link' => $waLink,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk UMKM berhasil ditambahkan ke etalase warga.',
            'data' => $product->load('user.house'),
        ], 201);
    }

    /**
     * Update Product
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $product = UmkmProduct::findOrFail($id);

        if ($product->user_id !== $user->id && !$user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak berhak mengedit produk ini.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:50',
            'description' => 'sometimes|required|string',
            'price' => 'sometimes|required|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produk UMKM berhasil diperbarui.',
            'data' => $product,
        ]);
    }

    /**
     * Delete Product
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $product = UmkmProduct::findOrFail($id);

        if ($product->user_id !== $user->id && !$user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak berhak menghapus produk ini.',
            ], 403);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus dari etalase.',
        ]);
    }
}
