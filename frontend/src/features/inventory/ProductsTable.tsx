import React from 'react';
import { MoreHorizontal } from 'lucide-react';

interface ProductsTableProps {
  data: any[];
  loading: boolean;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({ data, loading }) => {
  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading products...</div>;
  }

  if (!data.length) {
    return <div className="p-8 text-center text-muted-foreground">No products found.</div>;
  }

  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b bg-muted/50">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">SKU</th>
            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Stock</th>
            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Price</th>
            <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Status</th>
            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((product) => (
            <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
              <td className="p-4 align-middle font-medium">{product.name}</td>
              <td className="p-4 align-middle text-muted-foreground">{product.sku}</td>
              <td className="p-4 align-middle text-muted-foreground">{product.category?.name || 'Uncategorized'}</td>
              <td className="p-4 align-middle text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  product.current_stock <= product.min_stock 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {product.current_stock}
                </span>
              </td>
              <td className="p-4 align-middle text-right">${product.selling_price}</td>
              <td className="p-4 align-middle text-center">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {product.status}
                </span>
              </td>
              <td className="p-4 align-middle text-right">
                <button className="p-2 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
