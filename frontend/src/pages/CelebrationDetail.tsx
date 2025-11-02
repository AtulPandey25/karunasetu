import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { apiClient } from "../lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { useCart } from "../hooks/use-cart";

const CelebrationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
    const { addItem } = useCart();

  const { data: celebrationData, isLoading: celebrationIsLoading } = useQuery({
    queryKey: ["celebrations", id],
    queryFn: () => apiClient.get(`/celebrations/${id}`),
    enabled: !!id,
  });

  const { data: productsData, isLoading: productsIsLoading } = useQuery({
    queryKey: ["celebrations", id, "products"],
    queryFn: () => apiClient.get(`/celebrations/${id}/products`),
    enabled: !!id,
  });

  const celebration = celebrationData?.data.celebration;
  const products = productsData?.data.products;

  return (
    <div className="container mx-auto py-8">
      {celebrationIsLoading ? (
        <Skeleton className="h-10 w-3/4 mb-8" />
      ) : (
        <h1 className="text-3xl font-bold mb-8">{celebration?.title}</h1>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {(productsIsLoading || celebrationIsLoading) &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-40 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}

        {products?.map((product: any) => (
          <Card key={product._id} className="overflow-hidden">
            <CardHeader className="p-0">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-40 object-cover"
              />
            </CardHeader>
            <CardContent className="p-4 flex flex-col">
              <CardTitle className="text-lg font-semibold mb-1">
                {product.name}
              </CardTitle>
              <p className="text-gray-700 font-bold mb-3">₹{product.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500 flex-grow mb-4">{product.description}</p>
              <Button onClick={() => addItem(product)}>Add to Cart</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CelebrationDetailPage;