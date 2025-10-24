
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface GeneralSetting {
  id: number;
  settingCode: string;
  settingName: string;
  settingValue?: string;
  description?: string;
  isActive: boolean;
  storeCode?: string;
  createdAt: string;
  updatedAt: string;
}

export function GeneralSettingsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch general settings
  const { data: settings = [], isLoading } = useQuery<GeneralSetting[]>({
    queryKey: ["/api/general-settings"],
  });

  // Update setting active status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/general-settings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update setting status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/general-settings"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái thiết lập",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái thiết lập",
        variant: "destructive",
      });
    },
  });

  

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Thiết lập chung - Bán hàng</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : settings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có thiết lập nào.
          </div>
        ) : (
          <div className="space-y-2">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">
                  {setting.settingName}
                </h3>
                <Switch
                  checked={setting.isActive}
                  onCheckedChange={(checked) =>
                    updateStatusMutation.mutate({
                      id: setting.id,
                      isActive: checked,
                    })
                  }
                  disabled={updateStatusMutation.isPending}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
