import { Suspense } from "react";
import InvoiceList from "@/components/invoice/invoice-list";
import { Card, CardContent } from "@/components/ui/card";

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading invoices...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <InvoiceList />
    </Suspense>
  );
}
