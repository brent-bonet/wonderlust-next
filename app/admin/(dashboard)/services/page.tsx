import Btn from "@/components/Btn";
import {
  AdminPage,
  EditDetails,
  checkboxLabelClasses,
  inputClasses,
  labelClasses,
} from "@/components/admin/ui";
import { FALLBACK_SERVICES } from "@/lib/fallback-data";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";
import { deleteService, upsertService } from "./actions";

type ServiceRow = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: number | null;
  price_display: string | null;
  deposit_amount: number | null;
  duration_minutes: number | null;
  full_prepayment: boolean;
  active: boolean;
  sort_order: number;
};

async function loadServices(): Promise<{ rows: ServiceRow[]; demo: boolean }> {
  const supabase = await getSupabaseServerAuth();
  if (!supabase) {
    return {
      demo: true,
      rows: FALLBACK_SERVICES.map((s, i) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description,
        price: s.price,
        price_display: s.priceDisplay,
        deposit_amount: s.depositAmount,
        duration_minutes: s.durationMinutes,
        full_prepayment: s.fullPrepayment,
        active: true,
        sort_order: i,
      })),
    };
  }
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, category, description, price, price_display, deposit_amount, duration_minutes, full_prepayment, active, sort_order",
    )
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);
  return { rows: data ?? [], demo: false };
}

function ServiceFields({ service }: { service?: ServiceRow }) {
  return (
    <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
      <input type="hidden" name="id" value={service?.id ?? ""} />
      <div>
        <label className={labelClasses}>Name</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={service?.name ?? ""}
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>Category</label>
        <input
          name="category"
          type="text"
          defaultValue={service?.category ?? ""}
          placeholder="Haircuts & Color"
          className={inputClasses}
        />
      </div>
      <div className="col-span-full">
        <label className={labelClasses}>Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={service?.description ?? ""}
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>Price ($)</label>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={service?.price ?? ""}
          placeholder="blank = consult"
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>Price display</label>
        <input
          name="price_display"
          type="text"
          defaultValue={service?.price_display ?? ""}
          placeholder="$80+ / consult / free"
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>Deposit ($)</label>
        <input
          name="deposit_amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={service?.deposit_amount ?? ""}
          placeholder="blank = full amount"
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>Duration (minutes)</label>
        <input
          name="duration_minutes"
          type="number"
          step="5"
          min="5"
          defaultValue={service?.duration_minutes ?? 60}
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>Sort order</label>
        <input
          name="sort_order"
          type="number"
          step="1"
          defaultValue={service?.sort_order ?? 0}
          className={inputClasses}
        />
      </div>
      <div className="flex items-end gap-6 pb-1.5">
        <label className={checkboxLabelClasses}>
          <input
            name="full_prepayment"
            type="checkbox"
            defaultChecked={service?.full_prepayment ?? false}
            className="size-4 accent-toner-deep"
          />
          Full prepayment
        </label>
        <label className={checkboxLabelClasses}>
          <input
            name="active"
            type="checkbox"
            defaultChecked={service?.active ?? true}
            className="size-4 accent-toner-deep"
          />
          Active
        </label>
      </div>
    </div>
  );
}

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ rows, demo }, { error }] = await Promise.all([
    loadServices(),
    searchParams,
  ]);

  return (
    <AdminPage label="Menu" title="Services" error={error}>
      <EditDetails
        summary={
          <span className="font-mono text-[.85rem] uppercase tracking-[.14em] text-toner-deep">
            + Add a service
          </span>
        }
      >
        <form action={upsertService}>
          <fieldset disabled={demo} className="contents">
            <ServiceFields />
            <div className="mt-6">
              <Btn type="submit">Add service</Btn>
            </div>
          </fieldset>
        </form>
      </EditDetails>

      <ul className="mt-6 flex list-none flex-col gap-1">
        {rows.map((s) => (
          <li key={s.id}>
            <EditDetails
              summary={
                <>
                  <span
                    className={`whitespace-nowrap ${s.active ? "" : "text-[#8fa39d] line-through"}`}
                  >
                    {s.name}
                  </span>
                  <span className="font-mono text-[.75rem] text-[#8fa39d]">
                    {s.category ?? "—"}
                  </span>
                  <span
                    className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-fog"
                    aria-hidden="true"
                  />
                  <span className="whitespace-nowrap font-mono text-[.9rem] text-toner-deep">
                    {s.price_display ?? (s.price !== null ? `$${s.price}` : "consult")}
                  </span>
                </>
              }
            >
              <form action={upsertService}>
                <fieldset disabled={demo} className="contents">
                  <ServiceFields service={s} />
                  <div className="mt-6 flex items-center gap-5">
                    <Btn type="submit">Save</Btn>
                  </div>
                </fieldset>
              </form>
              <form action={deleteService} className="mt-4">
                <fieldset disabled={demo} className="contents">
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="cursor-pointer border-b border-fog bg-transparent font-mono text-[.8rem] text-tan hover:border-tan disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete service
                  </button>
                </fieldset>
              </form>
            </EditDetails>
          </li>
        ))}
      </ul>
    </AdminPage>
  );
}
