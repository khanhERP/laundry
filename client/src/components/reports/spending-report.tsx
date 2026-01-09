import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  TrendingDown,
  Building2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export function SpendingReport() {
  const { t, currentLanguage } = useTranslation();

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDayOfMonth.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState("today"); // "today", "thisWeek", "thisMonth", "lastMonth", "custom"

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    const today = new Date();

    switch (value) {
      case "today":
        setStartDate(today.toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setStartDate(yesterday.toISOString().split("T")[0]);
        setEndDate(yesterday.toISOString().split("T")[0]);
        break;
      case "thisWeek":
        const startOfWeek = new Date(today);
        // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const dayOfWeek = today.getDay();
        // Calculate days to subtract to get to Monday (day 1)
        // If Sunday (0), go back 6 days; otherwise go back (dayOfWeek - 1) days
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(today.getDate() - daysToMonday);
        setStartDate(startOfWeek.toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        break;
      case "lastWeek":
        const currentDayOfWeek = today.getDay();
        // Calculate days to subtract to get to Monday of current week
        const daysToCurrentMonday =
          currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

        // Get Monday of current week
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - daysToCurrentMonday);

        // Get Monday of last week (7 days before current Monday)
        const lastWeekMonday = new Date(currentMonday);
        lastWeekMonday.setDate(currentMonday.getDate() - 7);

        // Get Sunday of last week (6 days after last Monday)
        const lastWeekSunday = new Date(lastWeekMonday);
        lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);

        setStartDate(lastWeekMonday.toISOString().split("T")[0]);
        setEndDate(lastWeekSunday.toISOString().split("T")[0]);
        break;
      case "thisMonth":
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          2,
        );
        setStartDate(firstDayOfMonth.toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        break;
      case "lastMonth":
        const firstDayOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );
        const lastDayOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          0,
        );

        firstDayOfLastMonth.setHours(12);
        lastDayOfLastMonth.setHours(12);

        setStartDate(firstDayOfLastMonth.toISOString().split("T")[0]);
        setEndDate(lastDayOfLastMonth.toISOString().split("T")[0]);
        break;
      case "thisQuarter":
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const firstDayOfQuarter = new Date(
          today.getFullYear(),
          currentQuarter * 3,
          2,
        );
        setStartDate(firstDayOfQuarter.toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        break;
      case "thisYear":
        const firstDayOfYear = new Date(today.getFullYear(), 0, 2);
        setStartDate(firstDayOfYear.toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        break;
      case "custom":
        // Do nothing - user can use date inputs if needed
        break;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      // Map translation language codes to locale codes
      const localeMap = {
        ko: "ko-KR",
        en: "en-US",
        vi: "vi-VN",
      };

      const locale = localeMap[currentLanguage] || "ko-KR";

      return new Date(dateStr).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateStr || "";
    }
  };

  const [storeFilter, setStoreFilter] = useState("all");

  // Fetch store settings list
  const { data: storesData = [] } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/store-settings/list"],
    retry: 2,
  });

  // Fetch purchase receipts
  const {
    data: purchaseReceipts,
    isLoading: isLoadingReceipts,
    refetch: refetchPurchaseReceipts,
  } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/purchase-receipts", { startDate, endDate, storeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Add date filters if they exist
      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }
      if (storeFilter !== "all") {
        params.append("storeCode", storeFilter);
      }

      console.log("📊 Fetching purchase receipts with filter:", {
        startDate,
        endDate,
        storeFilter,
        url: `https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/purchase-receipts?${params.toString()}`,
      });

      const response = await fetch(
        `https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/purchase-receipts?${params.toString()}`,
      );
      if (!response.ok) throw new Error("Failed to fetch purchase receipts");
      const result = await response.json();

      console.log("📊 Purchase receipts API response:", {
        success: result.success,
        dataCount: result.data?.length || 0,
        sampleData: result.data?.[0],
      });

      return result.data || [];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/categories"],
  });

  // Fetch products to get category information
  const { data: products = [] } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/products"],
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/suppliers"],
  });

  // Fetch expense vouchers for debt calculation with date filter
  const { data: expenseVouchers = [], refetch: refetchExpenseVouchers } =
    useQuery({
      queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/expense-vouchers", { startDate, endDate, storeFilter }],
      queryFn: async () => {
        const params = new URLSearchParams();

        if (startDate) {
          params.append("startDate", startDate);
        }
        if (endDate) {
          params.append("endDate", endDate);
        }
        if (storeFilter !== "all") {
          params.append("storeCode", storeFilter);
        }

        console.log("💰 Fetching expense vouchers with filter:", {
          startDate,
          endDate,
          storeFilter,
          url: `https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/expense-vouchers?${params.toString()}`,
        });

        const response = await fetch(
          `https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/expense-vouchers?${params.toString()}`,
        );
        if (!response.ok) throw new Error("Failed to fetch expense vouchers");
        const result = await response.json();

        console.log("💰 Expense vouchers API response:", {
          dataCount: result?.length || 0,
          sampleData: result?.[0],
        });

        return result || [];
      },
    });

  // Fetch orders for revenue calculation
  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/orders/date-range", startDate, endDate, storeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (storeFilter !== "all") params.append("storeFilter", storeFilter);

      const response = await fetch(
        `https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/orders/date-range/${startDate}/${endDate}/all?${params.toString()}`,
      );
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Process data for reports
  const reportData = useMemo(() => {
    if (!purchaseReceipts || !categories || !products) {
      return {
        rawMaterials: [],
        managementExpenses: [],
        fixedExpenses: [],
        supplierDebts: [],
        totalRawMaterials: 0,
        totalManagementExpenses: 0,
        totalFixedExpenses: 0,
        totalSupplierDebt: 0,
        totalSpending: 0,
      };
    }

    // Extract data from API response structure: { success: true, data: [...] }
    let receiptsData = purchaseReceipts;

    console.log("📊 Purchase Receipts API Response:", purchaseReceipts);
    console.log("📊 Extracted receipts data:", receiptsData);
    console.log("📊 Total receipts:", receiptsData.length);

    const rawMaterialsMap = new Map();
    const managementExpensesMap = new Map();
    const fixedExpensesMap = new Map();
    const supplierDebtsMap = new Map();

    receiptsData.forEach((receipt: any) => {
      console.log("📦 Processing receipt:", {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        purchaseType: receipt.purchaseType,
        itemsCount: receipt.items?.length,
        storeCode: receipt.storeCode,
      });

      // Get supplier name from receipt.supplier object (API returns full supplier object)
      const supplierName = receipt.supplier?.name || "Không xác định";

      // I. Nguyên vật liệu đã mua (raw_materials)
      // Only process receipts with purchaseType = 'raw_materials'
      // Skip if purchaseType is explicitly set to other values like 'expenses'
      const isRawMaterial =
        receipt.purchaseType === "raw_materials" ||
        receipt.purchaseType === null ||
        receipt.purchaseType === undefined ||
        receipt.purchaseType === "";

      if (isRawMaterial) {
        console.log(
          `📦 Processing raw materials receipt ${receipt.receiptNumber}:`,
          {
            receiptId: receipt.id,
            itemsCount: receipt.items?.length,
            purchaseType: receipt.purchaseType,
          },
        );

        (receipt.items || []).forEach((item: any) => {
          console.log(`📦 Processing item:`, {
            productId: item.productId,
            productName: item.productName,
            total: item.total,
          });

          // Use product name as key to group by product
          const productName = item.productName || "Không xác định";

          if (!rawMaterialsMap.has(productName)) {
            rawMaterialsMap.set(productName, {
              productName,
              totalValue: 0,
            });
          }

          const productData = rawMaterialsMap.get(productName);
          const itemTotal = parseFloat(item.total?.toString() || "0");

          productData.totalValue += itemTotal;

          console.log(
            `📦 Updated product ${productName} total:`,
            productData.totalValue,
          );
        });
      }

      // II & III. Chi phí (expenses)
      if (receipt.purchaseType === "expenses") {
        (receipt.items || []).forEach((item: any) => {
          // Find the actual product from products list
          const product = products.find((p: any) => p.id === item.productId);

          console.log(`📦 Checking item:`, {
            productId: item.productId,
            productName: item.productName,
            productType: product?.productType,
            categoryId: product?.categoryId,
          });

          if (!product) {
            console.log(`⚠️ Product not found for item ${item.productId}`);
            return;
          }

          // Check if product_type == 4 and category_id == 15 for management expenses
          const isManagementExpense =
            product.productType === 4 && product.categoryId === 15;

          // Check if product_type == 4 and category_id == 17 for fixed expenses
          const isFixedExpense =
            product.productType === 4 && product.categoryId === 17;

          if (isManagementExpense) {
            console.log(`✅ Management expense found:`, {
              productName: item.productName,
              total: item.total,
            });

            // Management expenses - group by product
            const key = item.productName;
            if (!managementExpensesMap.has(key)) {
              managementExpensesMap.set(key, {
                itemName: item.productName,
                totalValue: 0,
              });
            }
            const expenseData = managementExpensesMap.get(key);
            const itemDiscount = parseFloat(
              item.discountAmount?.toString() || "0",
            );

            expenseData.totalValue += parseFloat(item.total?.toString() || "0");
          } else if (isFixedExpense) {
            console.log(`✅ Fixed expense found:`, {
              productName: item.productName,
              total: item.total,
            });

            // Fixed expenses - group by product
            const key = item.productName;
            if (!fixedExpensesMap.has(key)) {
              fixedExpensesMap.set(key, {
                itemName: item.productName,
                totalValue: 0,
              });
            }
            const expenseData = fixedExpensesMap.get(key);
            const itemDiscount = parseFloat(
              item.discountAmount?.toString() || "0",
            );

            expenseData.totalValue += parseFloat(item.total?.toString() || "0");
          } else {
            console.log(`❌ Item filtered out:`, {
              productName: item.productName,
              productType: product.productType,
              categoryId: product.categoryId,
              reason: `productType=${product.productType} (need 4), categoryId=${product.categoryId} (need 15 or 17)`,
            });
          }
        });
      }

      // IV. Công nợ nhà cung cấp (unpaid supplier debt)
      // Initialize supplier debt data if not exists
      const supplierId = receipt.supplier?.id;
      if (!supplierDebtsMap.has(supplierId)) {
        supplierDebtsMap.set(supplierId, {
          supplierName,
          totalDebt: 0, // Số tiền thiếu
          paidExpenses: 0, // Số tiền đã chi
        });
      }

      let sumDiscount = receipt.items.reduce((sum: number, item: any) => {
        return sum + parseFloat(item.discountAmount?.toString() || "0");
      }, 0);
      let debtData = supplierDebtsMap.get(supplierId);

      // Số tiền thiếu calculation from purchase receipts
      if (receipt.isPaid === false) {
        // Unpaid: add full total to debt
        debtData.totalDebt += receipt?.items?.reduce(
          (sum: number, item: any) => {
            return sum + parseFloat(item.total?.toString() || "0");
          },
          0,
        );
      }
    });

    const rawMaterials = Array.from(rawMaterialsMap.values());
    const managementExpenses = Array.from(managementExpensesMap.values());
    const fixedExpenses = Array.from(fixedExpensesMap.values());

    // Calculate expense vouchers by supplier (số tiền đã chi)
    // Filter expense vouchers by date range and store
    console.log("💰 Processing expense vouchers:", {
      total: expenseVouchers?.length || 0,
      dateRange: `${startDate} to ${endDate}`,
      storeFilter,
    });

    if (Array.isArray(expenseVouchers)) {
      expenseVouchers.forEach((voucher: any) => {
        // Check if voucher date is within range
        const voucherDate =
          voucher.date || voucher.voucherDate || voucher.createdAt;
        if (voucherDate) {
          const voucherDateOnly = new Date(voucherDate);
          voucherDateOnly.setHours(0, 0, 0, 0);

          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);

          const dateMatch = voucherDateOnly >= start && voucherDateOnly <= end;

          if (!dateMatch) {
            console.log("💰 Voucher filtered out (date):", {
              voucherNumber: voucher.voucherNumber,
              date: voucherDate,
              dateRange: `${startDate} to ${endDate}`,
            });
            return; // Skip this voucher
          }
        }

        // Filter by store if a store filter is applied and the voucher has a storeCode
        if (storeFilter !== "all" && voucher.storeCode !== storeFilter) {
          console.log("💰 Voucher filtered out (store):", {
            voucherNumber: voucher.voucherNumber,
            storeCode: voucher.storeCode,
            storeFilter,
          });
          return; // Skip this voucher
        }

        const supplierId = voucher.supplierId || voucher.supplier_id;
        if (supplierId) {
          // Initialize if supplier not in map yet
          if (!supplierDebtsMap.has(supplierId)) {
            // Try to get supplier info
            const supplier = suppliers?.find((s: any) => s.id === supplierId);
            supplierDebtsMap.set(supplierId, {
              supplierName: supplier?.name || "Không xác định",
              totalDebt: 0,
              paidExpenses: 0,
            });
          }
          const debtData = supplierDebtsMap.get(supplierId);
          const amount = parseFloat(voucher.amount?.toString() || "0");
          debtData.paidExpenses += amount;

          console.log("💰 Added expense voucher:", {
            voucherNumber: voucher.voucherNumber,
            supplierId,
            amount,
            totalPaidExpenses: debtData.paidExpenses,
          });
        }
      });
    }

    // Calculate final debt: số tiền nợ = số tiền thiếu - số tiền đã chi
    // Only include suppliers with final debt > 0
    const supplierDebts = Array.from(supplierDebtsMap.values())
      .map((item) => ({
        supplierName: item.supplierName,
        debtAmount: item.totalDebt - item.paidExpenses,
      }))
      .filter((item) => item.debtAmount > 0);

    const totalRawMaterials = rawMaterials.reduce(
      (sum, item) => sum + item.totalValue,
      0,
    );
    const totalManagementExpenses = managementExpenses.reduce(
      (sum, item) => sum + item.totalValue,
      0,
    );
    const totalFixedExpenses = fixedExpenses.reduce(
      (sum, item) => sum + item.totalValue,
      0,
    );
    const totalSupplierDebt = supplierDebts.reduce(
      (sum, item) => sum + item.debtAmount,
      0,
    );
    const totalSpending =
      totalRawMaterials + totalManagementExpenses + totalFixedExpenses;

    return {
      rawMaterials,
      managementExpenses,
      fixedExpenses,
      supplierDebts,
      totalRawMaterials,
      totalManagementExpenses,
      totalFixedExpenses,
      totalSupplierDebt,
      totalSpending,
    };
  }, [
    purchaseReceipts,
    categories,
    suppliers,
    products,
    expenseVouchers,
    storeFilter,
  ]);

  // Calculate total revenue from orders
  const totalRevenue = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return 0;
    return orders
      .filter((order: any) => order.paymentStatus === "paid")
      .reduce(
        (sum: number, order: any) => sum + parseFloat(order.total || "0"),
        0,
      );
  }, [orders]);

  const netProfit = totalRevenue - reportData.totalSpending;

  if (isLoadingReceipts) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">{t("reports.loadingData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter and Store Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t("reports.filter")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{t("common.storeLabel")}</Label>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cửa hàng" />
                </SelectTrigger>
                <SelectContent>
                  {storesData.filter((store: any) => store.typeUser !== 1)
                    .length > 1 && (
                    <SelectItem value="all">{t("common.allStores")}</SelectItem>
                  )}
                  {storesData
                    .filter((store: any) => store.typeUser !== 1)
                    .map((store: any) => (
                      <SelectItem key={store.id} value={store.storeCode}>
                        {store.storeName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {/* Quick Date Range Filter */}
            <div>
              <Label className="text-sm font-bold text-gray-800 mb-1 block">
                {t("common.dateRange")}
              </Label>
              <div className="flex gap-2">
                <Select value={dateRange} onValueChange={handleDateRangeChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue>
                      {dateRange === "custom"
                        ? t("reports.custom")
                        : dateRange === "today"
                          ? t("reports.toDay")
                          : dateRange === "yesterday"
                            ? t("reports.yesterday")
                            : dateRange === "thisWeek"
                              ? t("reports.thisWeek")
                              : dateRange === "lastWeek"
                                ? t("reports.lastWeek")
                                : dateRange === "thisMonth"
                                  ? t("reports.thisMonth")
                                  : dateRange === "lastMonth"
                                    ? t("reports.lastMonth")
                                    : dateRange === "thisQuarter"
                                      ? t("reports.thisQuarter")
                                      : dateRange === "thisYear"
                                        ? t("reports.thisYear")
                                        : t("common.dateRange")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">{t("reports.toDay")}</SelectItem>
                    <SelectItem value="yesterday">
                      {t("reports.yesterday")}
                    </SelectItem>
                    <SelectItem value="thisWeek">
                      {t("reports.thisWeek")}
                    </SelectItem>
                    <SelectItem value="lastWeek">
                      {t("reports.lastWeek")}
                    </SelectItem>
                    <SelectItem value="thisMonth">
                      {t("reports.thisMonth")}
                    </SelectItem>
                    <SelectItem value="lastMonth">
                      {t("reports.lastMonth")}
                    </SelectItem>
                    <SelectItem value="thisQuarter">
                      {t("reports.thisQuarter")}
                    </SelectItem>
                    <SelectItem value="thisYear">
                      {t("reports.thisYear")}
                    </SelectItem>
                    <SelectItem value="custom">
                      {t("reports.custom")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {dateRange === "custom" && (
                  <Popover
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="whitespace-nowrap"
                        onClick={() => setIsCalendarOpen(true)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(startDate)} - {formatDate(endDate)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                      side="bottom"
                      sideOffset={5}
                    >
                      <div className="p-4">
                        <div className="text-sm font-medium mb-4">
                          Từ ngày: {formatDate(startDate)} - Đến ngày:{" "}
                          {formatDate(endDate)}
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-2">
                              Từ ngày
                            </p>
                            <CalendarComponent
                              mode="single"
                              selected={
                                startDate
                                  ? new Date(startDate + "T00:00:00")
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  const year = date.getFullYear();
                                  const month = String(
                                    date.getMonth() + 1,
                                  ).padStart(2, "0");
                                  const day = String(date.getDate()).padStart(
                                    2,
                                    "0",
                                  );
                                  const newStartDate = `${year}-${month}-${day}`;
                                  setStartDate(newStartDate);
                                  if (newStartDate > endDate) {
                                    setEndDate(newStartDate);
                                  }
                                }
                              }}
                              initialFocus
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-2">
                              Đến ngày
                            </p>
                            <CalendarComponent
                              mode="single"
                              selected={
                                endDate
                                  ? new Date(endDate + "T00:00:00")
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  const year = date.getFullYear();
                                  const month = String(
                                    date.getMonth() + 1,
                                  ).padStart(2, "0");
                                  const day = String(date.getDate()).padStart(
                                    2,
                                    "0",
                                  );
                                  const newEndDate = `${year}-${month}-${day}`;
                                  if (newEndDate >= startDate) {
                                    setEndDate(newEndDate);
                                  }
                                }
                              }}
                              disabled={(date) => {
                                if (!startDate) return false;
                                const compareDate = new Date(
                                  startDate + "T00:00:00",
                                );
                                compareDate.setHours(0, 0, 0, 0);
                                const checkDate = new Date(date);
                                checkDate.setHours(0, 0, 0, 0);
                                return checkDate < compareDate;
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsCalendarOpen(false);
                              setDateRange("thisMonth");
                              handleDateRangeChange("thisMonth");
                            }}
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setIsCalendarOpen(false)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Xác nhận
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("reports.totalSpending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(reportData.totalSpending)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("reports.totalRevenue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("reports.netProfit")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}
            >
              {formatCurrency(netProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("reports.unpaidSupplierDebt")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(reportData.totalSupplierDebt)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* I. Raw Materials Purchased */}
      <Card>
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <TrendingDown className="w-5 h-5" />
            I. {t("reports.rawMaterialsPurchased")}
          </CardTitle>
          <CardDescription>
            {t("reports.totalValue")}:{" "}
            <span className="font-bold text-red-700">
              {formatCurrency(reportData.totalRawMaterials)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">{t("common.no")}</TableHead>
                <TableHead>{t("reports.productName")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.totalValue")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.rawMaterials.length > 0 ? (
                reportData.rawMaterials.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">
                      {formatCurrency(item.totalValue)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    {t("reports.noDataAvailable")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* II. Management Expenses */}
      <Card>
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <DollarSign className="w-5 h-5" />
            II. {t("reports.managementExpenses")}
          </CardTitle>
          <CardDescription>
            {t("reports.totalValue")}:{" "}
            <span className="font-bold text-red-700">
              {formatCurrency(reportData.totalManagementExpenses)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>{t("reports.itemName")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.totalValue")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.managementExpenses.length > 0 ? (
                reportData.managementExpenses.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {item.itemName}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">
                      {formatCurrency(item.totalValue)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    {t("reports.noDataAvailable")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* III. Fixed Expenses */}
      <Card>
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <DollarSign className="w-5 h-5" />
            III. {t("reports.fixedExpenses")}
          </CardTitle>
          <CardDescription>
            {t("reports.totalValue")}:{" "}
            <span className="font-bold text-red-700">
              {formatCurrency(reportData.totalFixedExpenses)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>{t("reports.itemName")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.totalValue")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.fixedExpenses.length > 0 ? (
                reportData.fixedExpenses.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {item.itemName}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">
                      {formatCurrency(item.totalValue)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    {t("reports.noDataAvailable")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* IV. Supplier Debts */}
      <Card>
        <CardHeader className="bg-orange-50">
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Building2 className="w-5 h-5" />
            {t("reports.unpaidSupplierDebt")}
          </CardTitle>
          <CardDescription>
            {t("reports.totalValue")}:{" "}
            <span className="font-bold text-orange-700">
              {formatCurrency(reportData.totalSupplierDebt)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>{t("reports.supplierName")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.debtAmount")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.supplierDebts.length > 0 ? (
                reportData.supplierDebts.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {item.supplierName}
                    </TableCell>
                    <TableCell className="text-right text-orange-600 font-semibold">
                      {formatCurrency(item.debtAmount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    {t("reports.noDataAvailable")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
