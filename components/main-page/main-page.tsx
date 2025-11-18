import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "../shared/logout-button/logout-button";
import Link from "next/link";

const MainPage = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get training plans
  const { data: trainingPlans } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Get diet history
  const { data: dietHistory } = await supabase
    .from("diet_history")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(10);

  return (
    <div className=" flex flex-col gap-4 max-w-screen-2xl pb-10 text-primary-foreground bg-foreground h-full w-full rounded-lg p-4">
      <h1 className="text-2xl font-bold mb-4">
        Witaj, {profile?.full_name || user.email}!
      </h1>

      <div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Training plans</h2>
          {trainingPlans?.map((plan) => (
            <div key={plan.id} className="border p-4 rounded mb-2">
              <h3>{plan.name}</h3>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Diet history</h2>
          {dietHistory?.map((entry) => (
            <div key={entry.id} className="border p-4 rounded mb-2">
              <p className="font-semibold">{entry.date}</p>
              <p className="text-sm">Calories: {entry.total_calories}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/profile-settings"
          className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition-colors"
        >
          Profile Settings
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
};

export default MainPage;
