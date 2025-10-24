
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import type { Supplier } from "@shared/schema";
import { SupplierFormModal } from "@/components/suppliers/supplier-form-modal";

export default function SuppliersPageContent() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = async (supplierId: number) => {
    if (!confirm(t("suppliers.confirmDelete"))) return;

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      await queryClient.refetchQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: t("common.success"), description: t("suppliers.deleteSuccess") });
    } catch (error) {
      toast({ title: t("common.error"), description: t("suppliers.deleteError"), variant: "destructive" });
    }
  };

  const filteredSuppliers = suppliersData?.filter((supplier: Supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.phone && supplier.phone.includes(searchTerm))
  ) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {t("suppliers.title")}
              </CardTitle>
              <CardDescription>{t("suppliers.description")}</CardDescription>
            </div>
            <Button onClick={() => { setEditingSupplier(null); setShowSupplierForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              {t("suppliers.addSupplier")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Input
                placeholder={t("suppliers.searchPlaceholder")}
                className="w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                {t("common.search")}
              </Button>
            </div>
          </div>

          {suppliersLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t("common.loading")}</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">{t("suppliers.noSuppliers")}</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-4 text-left font-medium text-sm text-gray-600 min-w-[150px]">
                      {t("suppliers.name")}
                    </th>
                    <th className="p-4 text-left font-medium text-sm text-gray-600 min-w-[120px]">
                      {t("suppliers.phone")}
                    </th>
                    <th className="p-4 text-left font-medium text-sm text-gray-600 min-w-[180px]">
                      {t("suppliers.email")}
                    </th>
                    <th className="p-4 text-left font-medium text-sm text-gray-600 min-w-[200px]">
                      {t("suppliers.address")}
                    </th>
                    <th className="p-4 text-left font-medium text-sm text-gray-600 w-[100px]">
                      {t("common.status")}
                    </th>
                    <th className="p-4 text-center font-medium text-sm text-gray-600 w-[120px]">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{supplier.name}</td>
                      <td className="p-4 text-sm text-gray-600">{supplier.phone || "-"}</td>
                      <td className="p-4 text-sm text-gray-600">{supplier.email || "-"}</td>
                      <td className="p-4 text-sm text-gray-600">{supplier.address || "-"}</td>
                      <td className="p-4">
                        <Badge variant="default" className="bg-green-500 text-white">
                          {t("common.active")}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditSupplier(supplier)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierFormModal
        isOpen={showSupplierForm}
        onClose={() => { setShowSupplierForm(false); setEditingSupplier(null); }}
        supplier={editingSupplier}
      />
    </div>
  );
}
