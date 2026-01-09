import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Target,
  Search,
  RefreshCw,
  Calendar,
} from "lucide-react";
import type { Order, Table as TableType } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
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

export function formatDateToYYYYMMDD(date: Date | string | number): string {
  const d = new Date(date); // Ensure input is a Date
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  tradeNumber: string;
  templateNumber: string;
  symbol: string;
  customerName: string;
  customerTaxCode: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  subtotal: string;
  tax: string;
  total: string;
  paymentMethod: number;
  invoiceDate: string;
  status: string;
  einvoiceStatus: number;
  invoiceStatus: number;
  notes: string;
  createdAt: string;
}

export function DashboardOverview() {
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

  const [storeFilter, setStoreFilter] = useState("all");
  const queryClient = useQueryClient();

  // Fetch stores for filtering
  const { data: storesData = [] } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/store-settings/list"],
    queryFn: async () => {
      try {
        const response = await fetch("https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/store-settings/list");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Filter out stores with typeUser = 1
        return Array.isArray(data)
          ? data.filter((store: any) => store.typeUser !== 1)
          : [];
      } catch (error) {
        console.error("Error fetching stores:", error);
        return [];
      }
    },
  });

  // Query orders by date range - using proper order data with store filtering
  const {
    data: ordersResponse,
    isLoading: ordersLoading,
    error: ordersError,
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
        console.log("Dashboard - Orders loaded:", data?.orders?.length || 0);
        return data;
      } catch (error) {
        console.error("Dashboard - Error fetching orders:", error);
        return { orders: [], pagination: {} };
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
  });

  // Extract orders array from response
  const orders = ordersResponse?.orders || [];

  // Query order items for all orders
  const { data: orderItems = [], isLoading: orderItemsLoading } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/order-items"],
    queryFn: async () => {
      try {
        const response = await fetch("https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/order-items");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Dashboard - Order items loaded:", data?.length || 0);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Dashboard - Error fetching order items:", error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
  });

  const { data: tables } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/tables"],
  });

  const handleRefresh = () => {
    // Refresh the queries to get the latest data for the selected date
    setStartDate(formatDateToYYYYMMDD(new Date()));
    setEndDate(formatDateToYYYYMMDD(new Date()));
    queryClient.invalidateQueries({ queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/orders"] });
    queryClient.invalidateQueries({ queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/orders/date-range"] });
    queryClient.invalidateQueries({ queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/order-items"] });
    queryClient.invalidateQueries({ queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/tables"] });
  };

  const getDashboardStats = () => {
    try {
      // Add proper loading and error checks
      if (ordersLoading || orderItemsLoading) {
        return {
          totalSalesRevenue: 0,
          subtotalRevenue: 0,
          periodOrderCount: 0,
          periodCustomerCount: 0,
          dailyAverageRevenue: 0,
          activeOrders: 0,
          occupiedTables: 0,
          monthRevenue: 0,
          averageOrderValue: 0,
          peakHour: 12,
          totalTables: Array.isArray(tables) ? tables.length : 0,
        };
      }

      // Ensure we have valid arrays
      let validOrders = Array.isArray(orders) ? orders : [];

      // Apply store filter
      if (storeFilter !== "all") {
        validOrders = validOrders.filter(
          (order: any) => order.storeCode === storeFilter,
        );
      }

      const validOrderItems = Array.isArray(orderItems) ? orderItems : [];
      const validTables = Array.isArray(tables) ? tables : [];

      console.log("Dashboard Debug - Raw Orders Data:", {
        totalOrders: validOrders.length,
        startDate,
        endDate,
        sampleOrders: validOrders.slice(0, 3).map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          total: o.total,
          orderedAt: o.orderedAt,
        })),
      });

      // Filter completed/paid orders only - data is already filtered by date range from API
      const completedOrders = validOrders.filter(
        (order: any) => order.status === "paid" || order.status === "completed",
      );

      console.log("Dashboard Debug - Raw Data:", {
        totalOrders: validOrders.length,
        completedOrders: completedOrders.length,
        totalOrderItems: validOrderItems.length,
        dateRange: `${startDate} to ${endDate}`,
        sampleCompletedOrder: completedOrders[0]
          ? {
              id: completedOrders[0].id,
              total: completedOrders[0].total,
              subtotal: completedOrders[0].subtotal,
              status: completedOrders[0].status,
              createdAt: completedOrders[0].createdAt,
            }
          : null,
      });

      // Calculate total revenue from completed orders (based on priceIncludeTax)
      const totalSalesRevenue = completedOrders.reduce(
        (sum: number, order: any) => {
          const subtotal = Number(order.subtotal || 0); // Tạm tính từ database
          const discount = Number(order.discount || 0); // Giảm giá từ database
          const tax = Number(order.tax || 0); // Thuế từ database
          const priceIncludeTax = order.priceIncludeTax === true; // Kiểm tra giá đã bao gồm thuế

          let salesRevenue = 0;
          if (priceIncludeTax) {
            // Nếu giá đã bao gồm thuế: Doanh số = subtotal - discount (thuế đã có trong subtotal)
            salesRevenue = subtotal - discount;
          } else {
            // Nếu giá chưa bao gồm thuế: Doanh số = subtotal - discount + tax
            salesRevenue = subtotal - discount + tax;
          }

          console.log(
            `Processing order ${order.orderNumber}: subtotal=${subtotal}, discount=${discount}, tax=${tax}, priceIncludeTax=${priceIncludeTax}, salesRevenue=${salesRevenue}`,
          );
          return sum + salesRevenue;
        },
        0,
      );

      // Calculate subtotal revenue from completed orders (excludes tax, after discount)
      const subtotalRevenue = completedOrders.reduce(
        (total: number, order: any) => {
          const subtotal = Number(order.subtotal || 0); // Tạm tính từ database
          const discount = Number(order.discount || 0); // Giảm giá từ database
          const netRevenue = subtotal - discount; // Doanh thu thuần = subtotal - discount
          return total + netRevenue;
        },
        0,
      );

      // Total count from completed orders only
      const periodOrderCount = completedOrders.length;

      // Calculate total customer count by summing customer_count from completed orders
      const periodCustomerCount = completedOrders.reduce(
        (total: number, order: any) => {
          const customerCount = Number(order.customerCount || 1); // Default to 1 if not specified
          console.log(
            `Processing order ${order.orderNumber}: customerCount=${customerCount}`,
          );
          return total + customerCount;
        },
        0,
      );

      // Calculate days difference for average
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1,
      );
      const dailyAverageRevenue = totalSalesRevenue / daysDiff;

      // Active orders (pending/in-progress orders only from all current orders, not date-filtered)
      const activeOrders = Array.isArray(allCurrentOrders)
        ? allCurrentOrders.filter(
            (order: any) =>
              order.status === "pending" ||
              order.status === "confirmed" ||
              order.status === "preparing" ||
              order.status === "ready" ||
              order.status === "served",
          ).length
        : 0;

      const occupiedTables = validTables.filter(
        (table: TableType) => table.status === "occupied",
      );

      // Month revenue: same as period revenue for the selected date range
      const monthRevenue = totalSalesRevenue;

      // Average order value
      const averageOrderValue =
        periodOrderCount > 0 ? totalSalesRevenue / periodOrderCount : 0;

      // Peak hours analysis from completed orders only
      const hourlyOrders: { [key: number]: number } = {};

      completedOrders.forEach((order: any) => {
        // Use orderedAt if available, otherwise fall back to createdAt
        const orderDate = new Date(order.orderedAt || order.createdAt);
        if (!isNaN(orderDate.getTime())) {
          const hour = orderDate.getHours();
          hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
        }
      });

      const peakHour = Object.keys(hourlyOrders).reduce(
        (peak, hour) =>
          hourlyOrders[parseInt(hour)] > (hourlyOrders[parseInt(peak)] || 0)
            ? hour
            : peak,
        "12",
      );

      const finalStats = {
        totalSalesRevenue,
        subtotalRevenue,
        periodOrderCount,
        periodCustomerCount,
        dailyAverageRevenue,
        activeOrders,
        occupiedTables: occupiedTables.length,
        monthRevenue,
        averageOrderValue,
        peakHour: parseInt(peakHour),
        totalTables: validTables.length,
      };

      console.log("Dashboard Debug - Final Stats:", {
        totalSalesRevenue,
        subtotalRevenue,
        periodOrderCount,
        periodCustomerCount,
        dailyAverageRevenue,
        activeOrders,
        dateRange: `${startDate} to ${endDate}`,
        completedOrdersCount: completedOrders.length,
        totalOrdersInRange: validOrders.length,
      });

      return finalStats;
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      return {
        totalSalesRevenue: 0,
        subtotalRevenue: 0,
        periodOrderCount: 0,
        periodCustomerCount: 0,
        dailyAverageRevenue: 0,
        activeOrders: 0,
        occupiedTables: 0,
        monthRevenue: 0,
        averageOrderValue: 0,
        peakHour: 12,
        totalTables: 0,
      };
    }
  };

  // Get all current orders to check active ones (not date-filtered)
  const { data: allCurrentOrders = [] } = useQuery({
    queryKey: ["https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/orders"],
    queryFn: async () => {
      try {
        const response = await fetch("https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/orders");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        return [];
      }
    },
  });

  const stats = getDashboardStats();

  const formatCurrency = (amount: number) => {
    try {
      return `${(amount || 0).toLocaleString()} ₫`;
    } catch (error) {
      console.error("Error formatting currency:", error);
      return "0 ₫";
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

  // Show loading state
  if (ordersLoading || orderItemsLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">{t("reports.loading")}</div>
      </div>
    );
  }

  // Show error state
  if (ordersError) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-red-500">
          Lỗi tải dữ liệu báo cáo: {ordersError?.message || "Unknown error"}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">{t("reports.loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {t("reports.dashboardTab")}
              </CardTitle>
              <CardDescription>
                {t("reports.dashboardDescription")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="store-filter">{t("reports.storeLabel")}</Label>
              <select
                id="store-filter"
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {storesData.filter((store: any) => store.typeUser !== 1)
                  .length > 1 && (
                  <option value="all">{t("reports.all")}</option>
                )}
                {storesData
                  .filter((store: any) => store.typeUser !== 1)
                  .map((store: any) => (
                    <option key={store.id} value={store.storeCode}>
                      {store.storeName}
                    </option>
                  ))}
              </select>

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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("reports.totalRevenue")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalSalesRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {startDate} ~ {endDate}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("reports.salesReportTotalRevenue")}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.subtotalRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {startDate === endDate
                    ? formatDate(startDate)
                    : `${formatDate(startDate)} - ${formatDate(endDate)}`}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("reports.totalOrders")}
                </p>
                <p className="text-2xl font-bold">{stats.periodOrderCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("reports.averageOrderValue")}{" "}
                  {formatCurrency(stats.averageOrderValue)}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("reports.totalCustomers")}
                </p>
                <p className="text-2xl font-bold">
                  {stats.periodCustomerCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("reports.peakHour")} {stats.peakHour}{" "}
                  <span>{t("reports.hour")}</span>
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t("reports.realTimeStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {t("reports.occupiedTables")}
              </span>
              <Badge
                variant={stats.occupiedTables > 0 ? "destructive" : "outline"}
              >
                {stats.occupiedTables} / {stats.totalTables}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {t("reports.tableUtilization")}
              </span>
              <Badge variant="secondary">
                {stats.totalTables > 0
                  ? Math.round((stats.occupiedTables / stats.totalTables) * 100)
                  : 0}{" "}
                %
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
