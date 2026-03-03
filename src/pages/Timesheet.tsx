import TimesheetContainer from "@/components/timesheet/timesheetContainer";
import { UserProvider } from "@/context/user-context";

const Timesheet = () => {
  return (
    <div>
      <UserProvider>
        <TimesheetContainer />
      </UserProvider>
    </div>
  );
};

export default Timesheet;
