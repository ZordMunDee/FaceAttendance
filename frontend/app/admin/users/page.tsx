import { userService } from "@/services/user-service";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { AddUserDialog } from "@/components/admin/AddUserDialog";

export default async function AdminUsersPage() {
  const users = await userService.getAllUsers(); // สร้าง API ใหม่ฝั่ง Backend

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">จัดการพนักงาน</h1>
        {/* 🚀 ปุ่มเพิ่มพนักงานแบบ Popup */}
        <AddUserDialog /> 
      </div>
      
      <UserManagementTable initialUsers={users} />
    </div>
  );
}