import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { Promotion } from "@shared/schema";

interface Store {
  id: number;
  storeCode: string;
  storeName: string;
}

interface Condition {
  id: string;
  minOrderAmount: string;
  discountValue: string;
  discountValueType: "percent" | "amount";
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getDefaultValidTo() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split("T")[0];
}

export function PromotionManagementContent() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formTab, setFormTab] = useState("info");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [conditions, setConditions] = useState<Condition[]>([]);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    promotionType: "order" as "order" | "product",
    discountType: "order_discount" as "order_discount" | "product_discount",
    discountValueType: "percent" as "percent" | "amount",
    discountValue: "0",
    minOrderAmount: "0",
    maxDiscountAmount: "",
    validFrom: getTodayString(),
    validTo: getDefaultValidTo(),
    isActive: true,
    selectedStores: [] as string[],
  });

  const { data: promotions = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/promotions"],
  });

  const { data: displayStores = [] } = useQuery<Store[]>({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/promotions/available-stores"],
  });

  const transformFormData = (data: typeof formData) => {
    const { selectedStores, ...rest } = data;
    const storeCode = selectedStores.length > 0 ? selectedStores.join(",") : "SYSTEM";
    // Chuyển đổi conditions array thành JSON để lưu trong database
    const conditionsToSave = conditions.length > 0 
      ? JSON.stringify(conditions.map(c => ({
          minOrderAmount: c.minOrderAmount,
          discountValue: c.discountValue,
          discountValueType: c.discountValueType
        })))
      : null;
    return { ...rest, storeCode, conditions: conditionsToSave };
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/promotions", transformFormData(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/promotions"] });
      toast({ title: "Tạo chương trình khuyến mãi thành công" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Lỗi khi tạo chương trình khuyến mãi", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return apiRequest("PUT", `https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/promotions/${id}`, transformFormData(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/promotions"] });
      toast({ title: "Cập nhật chương trình khuyến mãi thành công" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Lỗi khi cập nhật chương trình khuyến mãi", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/promotions"] });
      toast({ title: "Xóa chương trình khuyến mãi thành công" });
    },
    onError: () => {
      toast({ title: "Lỗi khi xóa chương trình khuyến mãi", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      promotionType: "order",
      discountType: "order_discount",
      discountValueType: "percent",
      discountValue: "0",
      minOrderAmount: "0",
      maxDiscountAmount: "",
      validFrom: getTodayString(),
      validTo: getDefaultValidTo(),
      isActive: true,
      selectedStores: [],
    });
    setConditions([]);
    setFormErrors({});
    setEditingPromotion(null);
    setFormTab("info");
  };

  const addCondition = () => {
    setConditions([...conditions, {
      id: Date.now().toString(),
      minOrderAmount: "0",
      discountValue: "0",
      discountValueType: formData.discountValueType
    }]);
  };

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const handleOpenDialog = (promotion?: Promotion) => {
    setFormErrors({});
    if (promotion) {
      setEditingPromotion(promotion);
      const selectedStores = (promotion.storeCode && promotion.storeCode !== "SYSTEM") 
        ? promotion.storeCode.split(",").map(s => s.trim())
        : [];
      setFormData({
        code: promotion.code || "",
        name: promotion.name || "",
        description: promotion.description || "",
        promotionType: (promotion.promotionType as "order" | "product") || "order",
        discountType: (promotion.discountType as "order_discount" | "product_discount") || "order_discount",
        discountValueType: (promotion.discountValueType as "percent" | "amount") || "percent",
        discountValue: promotion.discountValue || "0",
        minOrderAmount: promotion.minOrderAmount || "0",
        maxDiscountAmount: promotion.maxDiscountAmount || "",
        validFrom: promotion.validFrom || getTodayString(),
        validTo: promotion.validTo || getDefaultValidTo(),
        isActive: promotion.isActive ?? true,
        selectedStores,
      });
      
      // Tải các điều kiện nếu tồn tại trong promotion data
      try {
        const promoData = promotion as any;
        if (promoData.conditions) {
          const loadedConditions = typeof promoData.conditions === "string" 
            ? JSON.parse(promoData.conditions) 
            : promoData.conditions;
          if (Array.isArray(loadedConditions)) {
            // Thêm ID cho mỗi điều kiện để đảm bảo chúng có thể được xóa đúng
            const conditionsWithIds = loadedConditions.map((c) => ({
              ...c,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
            }));
            setConditions(conditionsWithIds);
          } else {
            setConditions([]);
          }
        } else {
          setConditions([]);
        }
      } catch (e) {
        setConditions([]);
      }
    } else {
      resetForm();
      setConditions([]);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Tên chương trình khuyến mãi là bắt buộc";
    }
    
    if (!formData.validFrom) {
      errors.validFrom = "Ngày bắt đầu là bắt buộc";
    }
    
    if (!formData.validTo) {
      errors.validTo = "Ngày kết thúc là bắt buộc";
    }
    
    if (formData.validFrom && formData.validTo && formData.validFrom > formData.validTo) {
      errors.validTo = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    
    if (formData.discountValue && isNaN(Number(formData.discountValue))) {
      errors.discountValue = "Giá trị khuyến mãi phải là số";
    }
    
    if (formData.discountValueType === "percent" && Number(formData.discountValue) > 100) {
      errors.discountValue = "Giá trị phần trăm không được vượt quá 100";
    }

    if (formData.selectedStores.length === 0) {
      errors.selectedStores = "Vui lòng chọn ít nhất một cửa hàng áp dụng";
    }
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast({ title: "Vui lòng kiểm tra lại thông tin", variant: "destructive" });
      if (errors.name) setFormTab("info");
      else if (errors.validFrom || errors.validTo) setFormTab("time");
      else if (errors.selectedStores) setFormTab("scope");
      return;
    }

    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa chương trình khuyến mãi này?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Quản lý cửa hàng</CardTitle>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-green-500 hover:bg-green-600"
          data-testid="button-add-promotion"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm KM
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Tên Chương trình KM</th>
                <th className="border px-4 py-2 text-left">Hiệu lực từ</th>
                <th className="border px-4 py-2 text-left">Hiệu lực đến</th>
                <th className="border px-4 py-2 text-center">Trạng thái</th>
                <th className="border px-4 py-2 text-center w-24"></th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border px-4 py-8 text-center text-gray-500">
                    Chưa có chương trình khuyến mãi nào
                  </td>
                </tr>
              ) : (
                promotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50" data-testid={`row-promotion-${promotion.id}`}>
                    <td className="border px-4 py-2">{promotion.name}</td>
                    <td className="border px-4 py-2">{formatDate(promotion.validFrom)}</td>
                    <td className="border px-4 py-2">{formatDate(promotion.validTo)}</td>
                    <td className="border px-4 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          promotion.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {promotion.isActive ? "Kích hoạt" : "Chưa áp dụng"}
                      </span>
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(promotion)}
                          data-testid={`button-edit-promotion-${promotion.id}`}
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(promotion.id)}
                          data-testid={`button-delete-promotion-${promotion.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? "Sửa chương trình khuyến mãi" : "Thêm chương trình khuyến mãi"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={formTab} onValueChange={setFormTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Thông tin khuyến mãi</TabsTrigger>
              <TabsTrigger value="time">Thời gian áp dụng</TabsTrigger>
              <TabsTrigger value="scope">Phạm vi áp dụng</TabsTrigger>
              <TabsTrigger value="history">Lịch sử KM</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Thông tin</h3>
                  
                  <div className="space-y-2">
                    <Label>Mã chương trình</Label>
                    <Input
                      placeholder="Mã tự động"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      data-testid="input-promotion-code"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tên chương trình <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Tên chương trình khuyến mãi"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                      }}
                      className={formErrors.name ? "border-red-500" : ""}
                      data-testid="input-promotion-name"
                    />
                    {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Input
                      placeholder="Ghi chú..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      data-testid="input-promotion-description"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.isActive}
                          onChange={() => setFormData({ ...formData, isActive: true })}
                          className="w-4 h-4 text-green-600"
                        />
                        <span>Kích hoạt</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!formData.isActive}
                          onChange={() => setFormData({ ...formData, isActive: false })}
                          className="w-4 h-4 text-gray-600"
                        />
                        <span>Chưa áp dụng</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-700 mb-4">Hình thức khuyến mại</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Khuyến mại theo</Label>
                    <Select
                      value={formData.promotionType}
                      onValueChange={(value: "order" | "product") =>
                        setFormData({ ...formData, promotionType: value })
                      }
                    >
                      <SelectTrigger data-testid="select-promotion-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Đơn hàng</SelectItem>
                        <SelectItem value="product">Mặt hàng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Hình thức</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value: "order_discount" | "product_discount") =>
                        setFormData({ ...formData, discountType: value })
                      }
                    >
                      <SelectTrigger data-testid="select-discount-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order_discount">Giảm giá đơn hàng</SelectItem>
                        <SelectItem value="product_discount">Giảm giá mặt hàng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Tổng tiền hàng</Label>
                    <Input
                      type="number"
                      placeholder="Từ"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      data-testid="input-min-order-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giá trị khuyến mại</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => {
                          setFormData({ ...formData, discountValue: e.target.value });
                          if (formErrors.discountValue) setFormErrors({ ...formErrors, discountValue: "" });
                        }}
                        className={formErrors.discountValue ? "border-red-500" : ""}
                        data-testid="input-discount-value"
                      />
                      <div className="flex border rounded-md">
                        <button
                          type="button"
                          className={`px-3 py-2 ${formData.discountValueType === "amount" ? "bg-green-500 text-white" : "bg-gray-100"}`}
                          onClick={() => setFormData({ ...formData, discountValueType: "amount" })}
                        >
                          VND
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-2 ${formData.discountValueType === "percent" ? "bg-green-500 text-white" : "bg-gray-100"}`}
                          onClick={() => setFormData({ ...formData, discountValueType: "percent" })}
                        >
                          %
                        </button>
                      </div>
                    </div>
                    {formErrors.discountValue && <p className="text-red-500 text-sm">{formErrors.discountValue}</p>}
                  </div>
                  <div></div>
                </div>
                {conditions.length > 0 && (
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <h4 className="font-semibold text-gray-700">Các điều kiện khác</h4>
                    {conditions.map((condition) => (
                      <div key={condition.id} className="grid grid-cols-3 gap-4 items-end p-3 bg-gray-50 rounded">
                        <div className="space-y-2">
                          <Label className="text-sm">Tổng tiền hàng</Label>
                          <Input
                            type="number"
                            placeholder="Từ"
                            value={condition.minOrderAmount}
                            onChange={(e) => updateCondition(condition.id, "minOrderAmount", e.target.value)}
                            data-testid={`input-condition-min-amount-${condition.id}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Giá trị khuyến mại</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={condition.discountValue}
                              onChange={(e) => updateCondition(condition.id, "discountValue", e.target.value)}
                              data-testid={`input-condition-discount-value-${condition.id}`}
                            />
                            <div className="flex border rounded-md">
                              <button
                                type="button"
                                className={`px-2 py-2 text-sm ${condition.discountValueType === "amount" ? "bg-green-500 text-white" : "bg-gray-100"}`}
                                onClick={() => updateCondition(condition.id, "discountValueType", "amount")}
                              >
                                VND
                              </button>
                              <button
                                type="button"
                                className={`px-2 py-2 text-sm ${condition.discountValueType === "percent" ? "bg-green-500 text-white" : "bg-gray-100"}`}
                                onClick={() => updateCondition(condition.id, "discountValueType", "percent")}
                              >
                                %
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCondition(condition.id)}
                          className="text-red-500 hover:text-red-700 justify-self-end"
                          data-testid={`button-remove-condition-${condition.id}`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  type="button"
                  variant="outline" 
                  className="mt-4"
                  onClick={addCondition}
                  data-testid="button-add-condition"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm điều kiện
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="time" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hiệu lực từ <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => {
                      setFormData({ ...formData, validFrom: e.target.value });
                      if (formErrors.validFrom) setFormErrors({ ...formErrors, validFrom: "" });
                    }}
                    className={formErrors.validFrom ? "border-red-500" : ""}
                    data-testid="input-valid-from"
                  />
                  {formErrors.validFrom && <p className="text-red-500 text-sm">{formErrors.validFrom}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Hiệu lực đến <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => {
                      setFormData({ ...formData, validTo: e.target.value });
                      if (formErrors.validTo) setFormErrors({ ...formErrors, validTo: "" });
                    }}
                    className={formErrors.validTo ? "border-red-500" : ""}
                    data-testid="input-valid-to"
                  />
                  {formErrors.validTo && <p className="text-red-500 text-sm">{formErrors.validTo}</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scope" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Chọn cửa hàng áp dụng khuyến mãi <span className="text-red-500">*</span></Label>
                <div className={`space-y-2 border rounded-md p-3 ${formErrors.selectedStores ? "bg-red-50 border-red-300" : "bg-gray-50"}`}>
                  {displayStores.length > 0 ? (
                    displayStores.map((store) => (
                      <label key={store.storeCode || store.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedStores.includes(store.storeCode)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                selectedStores: [...formData.selectedStores, store.storeCode]
                              });
                              if (formErrors.selectedStores) setFormErrors({ ...formErrors, selectedStores: "" });
                            } else {
                              setFormData({
                                ...formData,
                                selectedStores: formData.selectedStores.filter(s => s !== store.storeCode)
                              });
                            }
                          }}
                          className="w-4 h-4"
                          data-testid={`checkbox-store-${store.storeCode}`}
                        />
                        <span>{store.storeName || store.storeCode || "Cửa hàng"}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Không có cửa hàng khả dụng</p>
                  )}
                </div>
                {formErrors.selectedStores && <p className="text-red-500 text-sm">{formErrors.selectedStores}</p>}
                {formData.selectedStores.length > 0 && (
                  <p className="text-green-600 text-sm">✓ Đã chọn {formData.selectedStores.length} cửa hàng</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              <p className="text-gray-500">Lịch sử khuyến mãi sẽ hiển thị ở đây...</p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              className="bg-green-500 hover:bg-green-600"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-promotion"
            >
              {createMutation.isPending || updateMutation.isPending ? "Đang lưu..." : "Lưu (F9)"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsDialogOpen(false);
              }}
              data-testid="button-cancel-promotion"
            >
              Bỏ qua
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
