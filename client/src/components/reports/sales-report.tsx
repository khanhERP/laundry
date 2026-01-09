import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  RefreshCw,
  Filter,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
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

export function SalesReport() {
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

  const [storeFilter, setStoreFilter] = useState<string>("all");

  // Get user info from localStorage to check if admin
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.isAdmin || user?.typeUser === 1;

  // Fetch stores list for filter dropdown
  const { data: storesData = [] } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/store-settings/list"],
    queryFn: async () => {
      try {
        const response = await fetch("https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/store-settings/list", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch stores");
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching stores:", error);
        return [];
      }
    },
    retry: 2,
  });

  // Query orders by date range using /api/orders/list with proper store filtering
  const {
    data: ordersResponse,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/orders/list", startDate, endDate, "all", storeFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          status: "all",
        });

        // Handle store filter based on conditions:
        // 1. If "all" selected -> pass "all" to server (server will handle admin vs non-admin logic)
        // 2. If specific store selected -> pass exact storeCode
        if (storeFilter === "all") {
          params.append("storeFilter", "all");
        } else if (storeFilter) {
          params.append("storeFilter", storeFilter);
        }

        const response = await fetch(`https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/orders/list?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Sales Report - Orders loaded:", data?.orders?.length || 0);
        return data;
      } catch (error) {
        console.error("Sales Report - Error fetching orders:", error);
        return { orders: [], pagination: {} };
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Extract orders array from response
  const orders = ordersResponse?.orders || [];

  // Query order items by date range
  const {
    data: orderItems = [],
    isLoading: orderItemsLoading,
    refetch: refetchOrderItems,
  } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/order-items/date-range", startDate, endDate, "all"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/order-items/${startDate}/${endDate}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching order items:", error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const getSalesData = () => {
    // Default return structure for empty data
    const defaultData = {
      dailySales: [],
      paymentMethods: [],
      hourlySales: {},
      totalRevenue: 0,
      subtotalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
    };

    try {
      // Combine all data sources - only paid/completed items
      // Filter orders to include only those with status 'paid' or equivalent
      const paidOrders = orders.filter((order: any) => order.status === "paid");

      // Group order items by order ID to avoid duplicates and ensure correct association
      const orderItemsMap = new Map<string, any[]>();
      orderItems.forEach((item: any) => {
        if (!orderItemsMap.has(item.orderId)) {
          orderItemsMap.set(item.orderId, []);
        }
        orderItemsMap.get(item.orderId)!.push(item);
      });

      // Create a unique set of order items to avoid duplicates
      const uniqueOrderItems = Array.from(orderItemsMap.values()).flat();

      const combinedData = [
        ...paidOrders,
        ...uniqueOrderItems.filter((item: any) => {
          // Check if the order item belongs to a paid order
          const correspondingOrder = paidOrders.find(
            (order: any) => order.id === item.orderId,
          );
          return !!correspondingOrder;
        }),
      ];

      // Remove any potential duplicate orders from the combined list
      const uniqueCombinedData = Array.from(
        new Map(
          combinedData.map((item) => [item.id || item.orderId, item]),
        ).values(),
      );

      if (uniqueCombinedData.length === 0) {
        return defaultData;
      }

      // Daily sales breakdown - process orders directly for accurate customer count
      const dailySales: {
        [date: string]: {
          revenue: number;
          orders: number;
          customers: number;
          discount: number;
        };
      } = {};

      // Process paid orders for daily sales
      paidOrders.forEach((order: any) => {
        try {
          const orderDate = new Date(order.orderedAt || order.createdAt);
          if (isNaN(orderDate.getTime())) return;

          const dateStr = orderDate.toISOString().split("T")[0];

          if (!dailySales[dateStr]) {
            dailySales[dateStr] = {
              revenue: 0,
              orders: 0,
              customers: 0,
              discount: 0,
            };
          }

          const orderSubtotal = Number(order.subtotal || 0);
          const orderTax = Number(order.tax || 0);
          const orderDiscount = Number(order.discount || 0);

          dailySales[dateStr].revenue += orderSubtotal + orderTax;
          dailySales[dateStr].orders += 1;
          dailySales[dateStr].customers += Number(order.customerCount || 1); // Use actual customerCount from order
          dailySales[dateStr].discount += orderDiscount;
        } catch (error) {
          console.warn("Error processing order for daily sales:", error);
        }
      });

      // Payment method breakdown
      const paymentMethods: {
        [method: string]: { count: number; revenue: number };
      } = {};

      // Process paid orders for payment methods
      paidOrders.forEach((order: any) => {
        try {
          const paymentMethodStr = order.paymentMethod || "cash";
          const orderSubtotal = Number(order.subtotal || 0);
          const orderDiscount = Number(order.discount || 0);
          const orderTax = Number(order.tax || 0);
          const orderTotal = Number(order.total || 0);

          // Calculate revenue for this order
          const orderPriceIncludeTax = order.priceIncludeTax === true;
          let orderRevenue;
          if (orderPriceIncludeTax) {
            orderRevenue = orderSubtotal; // Revenue = subtotal (already net of discount)
          } else {
            orderRevenue = Math.max(0, orderSubtotal - orderDiscount);
          }

          // Try to parse as JSON for multi-payment
          try {
            const parsed = JSON.parse(paymentMethodStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Multi-payment: distribute revenue proportionally by payment amounts
              const totalPaymentAmount = parsed.reduce(
                (sum: number, pm: any) => sum + Number(pm.amount || 0),
                0,
              );

              parsed.forEach((pm: any) => {
                const method = pm.method || "cash";
                const paymentAmount = Number(pm.amount || 0);

                if (!paymentMethods[method]) {
                  paymentMethods[method] = { count: 0, revenue: 0 };
                }

                // Distribute revenue proportionally
                const revenueShare =
                  totalPaymentAmount > 0
                    ? (paymentAmount / totalPaymentAmount) * orderRevenue
                    : 0;
                paymentMethods[method].revenue += revenueShare;
                paymentMethods[method].count += 1;
              });
            } else {
              // Not a valid JSON array, treat as single payment
              if (!paymentMethods[paymentMethodStr]) {
                paymentMethods[paymentMethodStr] = { count: 0, revenue: 0 };
              }
              paymentMethods[paymentMethodStr].count += 1;
              paymentMethods[paymentMethodStr].revenue += orderRevenue;
            }
          } catch (e) {
            // Not JSON, single payment method
            if (!paymentMethods[paymentMethodStr]) {
              paymentMethods[paymentMethodStr] = { count: 0, revenue: 0 };
            }
            paymentMethods[paymentMethodStr].count += 1;
            paymentMethods[paymentMethodStr].revenue += orderRevenue;
          }
        } catch (error) {
          console.warn("Error processing order for payment methods:", error);
        }
      });

      // Hourly breakdown
      const hourlySales: { [hour: number]: number } = {};
      uniqueCombinedData.forEach((item: any) => {
        try {
          const itemDate = new Date(item.orderedAt || item.createdAt);
          if (isNaN(itemDate.getTime())) return;

          const hour = itemDate.getHours();
          const itemPrice = Number(item.price || item.total || 0);
          const itemQuantity = Number(item.quantity || 1);
          const revenue = itemPrice * itemQuantity;

          // Get discount from database, default to 0 if no data
          const discountAmount =
            item.discount !== undefined && item.discount !== null
              ? Number(item.discount)
              : 0;

          if (!isNaN(revenue) && revenue > 0) {
            hourlySales[hour] = (hourlySales[hour] || 0) + revenue;
          }
        } catch (error) {
          console.warn("Error processing item for hourly sales:", error);
        }
      });

      // Calculate totals based on unique combined data
      const totalRevenue = paidOrders.reduce((sum: number, order: any) => {
        const subtotal = Number(order.subtotal || 0); // Tạm tính từ database
        const discount = Number(order.discount || 0); // Giảm giá từ database
        const tax = Number(order.tax || 0); // Thuế từ database
        const priceIncludeTax = order.priceIncludeTax === true; // Kiểm tra giá đã bao gồm thuế

        let salesRevenue = 0;
        if (priceIncludeTax) {
          // Nếu giá đã bao gồm thuế: Doanh số = subtotal - discount (subtotal đã có thuế)
          salesRevenue = subtotal - discount;
        } else {
          // Nếu giá chưa bao gồm thuế: Doanh số = subtotal - discount + tax
          salesRevenue = subtotal - discount + tax;
        }

        return sum + salesRevenue;
      }, 0);

      // Calculate subtotal revenue (excluding tax)
      const subtotalRevenue = paidOrders.reduce((total: number, order: any) => {
        const subtotal = Number(order.subtotal || 0); // Tạm tính từ database
        const discount = Number(order.discount || 0); // Giảm giá từ database
        const netRevenue = subtotal - discount; // Doanh thu thuần = subtotal - discount
        return total + netRevenue;
      }, 0);

      // Total orders should be based on unique orders, not items
      const totalOrders = paidOrders.length;

      // Calculate total customers by summing customer_count from paid orders (same as dashboard)
      const totalCustomers = paidOrders.reduce((total: number, order: any) => {
        const customerCount = Number(order.customerCount || 1); // Default to 1 if not specified
        console.log(
          `Sales Report - Processing order ${order.orderNumber}: customerCount=${customerCount}, running total=${total + customerCount}`,
        );
        return total + customerCount;
      }, 0);

      console.log(`Sales Report - Final customer count calculation:`, {
        totalPaidOrders: paidOrders.length,
        totalCustomers: totalCustomers,
        paidOrdersSample: paidOrders.slice(0, 2).map((o) => ({
          orderNumber: o.orderNumber,
          customerCount: o.customerCount,
        })),
      });

      console.log(`Sales Report - Returning final data:`, {
        totalCustomers,
        totalOrders,
        totalRevenue,
        verification: `${totalCustomers} customers from ${totalOrders} orders`,
      });
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const paymentMethodsArray = Object.entries(paymentMethods).map(
        ([method, data]) => ({
          method,
          ...data,
        }),
      );

      return {
        dailySales: Object.entries(dailySales)
          .map(([date, data]) => ({
            date,
            ...data,
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        paymentMethods: paymentMethodsArray,
        hourlySales,
        totalRevenue,
        subtotalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
      };
    } catch (error) {
      console.error("Error processing sales data:", error);
      return defaultData;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${Math.ceil(amount).toLocaleString()} ₫`;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: t("common.cash"),
      card: t("common.creditCard"),
      creditCard: t("common.creditCard"),
      credit_card: t("common.creditCard"),
      debitCard: t("common.debitCard"),
      debit_card: t("common.debitCard"),
      transfer: t("common.transfer"),
      einvoice: t("reports.einvoice"),
      momo: t("common.momo"),
      zalopay: t("common.zalopay"),
      vnpay: t("common.vnpay"),
      qrCode: t("common.qrCode"),
      shopeepay: t("common.shopeepay"),
      grabpay: t("common.grabpay"),
      mobile: "Mobile",
      1: t("common.cash"),
      2: t("common.creditCard"),
      3: t("common.transfer"),
      4: t("common.momo"),
      5: t("common.zalopay"),
      6: t("common.vnpay"),
      7: t("common.qrCode"),
    };
    return (
      labels[method as keyof typeof labels] ||
      `${t("common.paymentMethod")} ${method}`
    );
  };

  const handleRefresh = () => {
    refetchOrders();
  };

  const salesData = getSalesData();
  const hasError = !!ordersError;
  const isLoading = ordersLoading || orderItemsLoading;

  const peakHour =
    salesData && Object.keys(salesData.hourlySales).length > 0
      ? Object.entries(salesData.hourlySales).reduce(
          (peak, [hour, revenue]) =>
            revenue > (salesData.hourlySales[parseInt(peak)] || 0)
              ? hour
              : peak,
          "12",
        )
      : "12";

  // Loading state component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-20 bg-gray-200 rounded animate-pulse"
        ></div>
      ))}
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <Card className="border-red-200">
      <CardContent className="p-6">
        <div className="text-center text-red-600">
          <p className="mb-4">{t("common.errorLoadingData")}</p>
          <p className="text-sm text-gray-600 mb-4">
            {ordersError?.message || "Không thể tải dữ liệu đơn hàng"}
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("reports.refresh")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="border-green-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t("reports.salesAnalysis")}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {t("reports.analyzeRevenue")}
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium whitespace-nowrap">
                  {t("reports.storeLabel")}
                </Label>
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  {storesData.filter((store: any) => store.typeUser !== 1)
                    .length > 1 && <option value="all">Tất cả</option>}
                  {storesData
                    .filter((store: any) => store.typeUser !== 1)
                    .map((store: any) => (
                      <option key={store.id} value={store.storeCode}>
                        {store.storeName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Quick Date Range Filter */}
              <div className="relative">
                {/* <Label className="text-sm font-bold text-gray-800 mb-3 block">
                  {t("common.dateRange")}
                </Label> */}
                <div className="flex gap-2">
                  <Select
                    value={dateRange}
                    onValueChange={handleDateRangeChange}
                  >
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
                      <SelectItem value="today">
                        {t("reports.toDay")}
                      </SelectItem>
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
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : hasError ? (
        <ErrorState />
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <Card className="border-green-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("reports.totalRevenue")}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(salesData?.totalRevenue || 0)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("reports.salesReportTotalRevenue")}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(salesData?.subtotalRevenue || 0)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("reports.totalQuantitySold")}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {salesData?.totalOrders || 0}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("reports.averageOrderValue")}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(salesData?.averageOrderValue || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("reports.totalCustomers")}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {salesData?.totalCustomers || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("reports.peakHour")}: {peakHour}
                    {t("reports.hour")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Sales */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t("reports.dailySales")}
                </CardTitle>
                <CardDescription>{t("reports.analyzeRevenue")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 bg-white">
                          {t("reports.date")}
                        </TableHead>
                        <TableHead className="sticky top-0 bg-white">
                          {t("reports.totalRevenue")}
                        </TableHead>
                        <TableHead className="sticky top-0 bg-white">
                          {t("reports.totalOrders")}
                        </TableHead>
                        <TableHead className="sticky top-0 bg-white">
                          {t("reports.totalCustomers")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData?.dailySales &&
                      salesData.dailySales.length > 0 ? (
                        salesData.dailySales.map((day) => (
                          <TableRow key={day.date} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              {formatDate(day.date)}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(day.revenue)}
                            </TableCell>
                            <TableCell>{day.orders}</TableCell>
                            <TableCell>{day.customers}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-gray-500 py-8"
                          >
                            {t("reports.noSalesData")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t("reports.paymentMethods")}
                </CardTitle>
                <CardDescription>
                  {t("reports.analyzeRevenue")}
                  {salesData?.paymentMethods &&
                    salesData.paymentMethods.length > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({salesData.paymentMethods.length}{" "}
                        {t("reports.paymentMethods").toLowerCase()} •{" "}
                        {salesData.totalOrders}{" "}
                        {t("reports.orders").toLowerCase()})
                      </span>
                    )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {salesData?.paymentMethods &&
                  salesData.paymentMethods.length > 0 ? (
                    salesData.paymentMethods.map((payment) => {
                      const percentage =
                        (salesData?.totalRevenue || 0) > 0
                          ? (Number(payment.revenue) /
                              Number(salesData?.totalRevenue || 1)) *
                            100
                          : 0;

                      return (
                        <div
                          key={payment.method}
                          className="space-y-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge
                                  variant="outline"
                                  className="font-semibold text-blue-700 border-blue-300 bg-blue-50"
                                >
                                  {getPaymentMethodLabel(payment.method)}
                                </Badge>
                                <span className="text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded">
                                  {t("reports.code")}: {payment.method}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                  <div className="text-gray-600">
                                    {t("reports.orderCount")}:
                                  </div>
                                  <div className="font-semibold text-blue-600 text-lg">
                                    {payment.count} {t("reports.orders")}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-gray-600">
                                    {t("reports.total")}:
                                  </div>
                                  <div className="font-bold text-green-600 text-lg">
                                    {formatCurrency(payment.revenue)}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {t("reports.percentage")}:
                                </span>
                                <span className="text-sm font-semibold text-purple-600">
                                  {isFinite(percentage)
                                    ? percentage.toFixed(1)
                                    : "0.0"}
                                  %
                                </span>
                                <span className="text-xs text-gray-500">
                                  {t("reports.totalRevenue")}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>{t("reports.percentage")}</span>
                              <span>
                                {isFinite(percentage)
                                  ? percentage.toFixed(1)
                                  : "0.0"}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${Math.min(percentage, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-600 mb-2">
                          {t("reports.noPaymentData")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t("reports.noPaymentDataDescription")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
