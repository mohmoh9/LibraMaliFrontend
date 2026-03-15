// src/store/cart.store.ts
import { create } from "zustand";
import type { Cart } from "@/types";
import api from "@/lib/api";

interface CartState {
  cart: Cart | null;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantite: number) => Promise<void>;
  updateItem: (itemId: number, quantite: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  previewPromo: (code: string) => Promise<Cart>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/cart");
      set({ cart: data.data });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (productId, quantite) => {
    const { data } = await api.post("/cart/items", { productId, quantite });
    set({ cart: data.data });
  },

  updateItem: async (itemId, quantite) => {
    const { data } = await api.patch(`/cart/items/${itemId}`, { quantite });
    set({ cart: data.data });
  },

  removeItem: async (itemId) => {
    const { data } = await api.delete(`/cart/items/${itemId}`);
    set({ cart: data.data });
  },

  clearCart: async () => {
    await api.delete("/cart/clear");
    set({ cart: null });
    get().fetchCart();
  },

  previewPromo: async (code) => {
    const { data } = await api.post("/cart/promo/preview", { code });
    return data.data as Cart;
  },
}));