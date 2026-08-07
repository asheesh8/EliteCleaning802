import { saveClient } from "@/app/crew/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { CONDITION_LABELS } from "@/lib/estimate";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  propertyType: string;
  squareFeet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  conditionLevel: number;
  frequency: string;
  rate: number | null;
  status: string;
  notes: string | null;
  gateCode: string | null;
};

/**
 * Server component — a plain form posting to a server action. No client
 * JS needed, so it works before hydration and stays fast.
 */
export function ClientForm({ client }: { client?: Client }) {
  return (
    <form action={saveClient} className="grid gap-6 xl:grid-cols-2">
      {client && <input type="hidden" name="id" value={client.id} />}

      {/* ---------- Contact ---------- */}
      <div className="space-y-5 rounded-card border border-border-base bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-text">Contact</h2>

        <Field label="Name" required>
          <Input name="name" required defaultValue={client?.name} />
        </Field>

        <Field label="Company" hint="Optional — for offices and rental firms.">
          <Input name="company" defaultValue={client?.company ?? ""} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email">
            <Input name="email" type="email" defaultValue={client?.email ?? ""} />
          </Field>
          <Field label="Phone">
            <Input name="phone" type="tel" defaultValue={client?.phone ?? ""} />
          </Field>
        </div>

        <Field label="Street address">
          <Input name="address" defaultValue={client?.address ?? ""} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Town">
            <Input name="city" defaultValue={client?.city ?? "Rutland"} />
          </Field>
          <Field label="State">
            <Input name="state" defaultValue={client?.state ?? "VT"} />
          </Field>
          <Field label="ZIP">
            <Input name="zip" defaultValue={client?.zip ?? ""} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Latitude"
            hint="Right-click the pin in Google Maps to copy."
          >
            <Input
              name="lat"
              type="number"
              step="any"
              defaultValue={client?.lat ?? ""}
              placeholder="43.6106"
            />
          </Field>
          <Field label="Longitude" hint="Needed for accurate drive times.">
            <Input
              name="lng"
              type="number"
              step="any"
              defaultValue={client?.lng ?? ""}
              placeholder="-72.9726"
            />
          </Field>
        </div>

        <Field label="Access / gate code">
          <Input name="gateCode" defaultValue={client?.gateCode ?? ""} />
        </Field>
      </div>

      {/* ---------- Property profile ---------- */}
      <div className="space-y-5 rounded-card border border-border-base bg-surface p-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-text">
            Property profile
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            These fields drive every time estimate for this client.
          </p>
        </div>

        <Field label="Property type">
          <Select name="propertyType" defaultValue={client?.propertyType ?? "residential"}>
            <option value="residential">Home</option>
            <option value="airbnb">Airbnb / rental</option>
            <option value="commercial">Office / commercial</option>
          </Select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Square feet">
            <Input
              name="squareFeet"
              type="number"
              min={0}
              defaultValue={client?.squareFeet ?? ""}
            />
          </Field>
          <Field label="Bedrooms">
            <Input
              name="bedrooms"
              type="number"
              min={0}
              defaultValue={client?.bedrooms ?? ""}
            />
          </Field>
          <Field label="Bathrooms">
            <Input
              name="bathrooms"
              type="number"
              min={0}
              defaultValue={client?.bathrooms ?? ""}
            />
          </Field>
        </div>

        <Field
          label="Condition"
          hint="Be honest — this is what stops jobs running long."
        >
          <Select name="conditionLevel" defaultValue={client?.conditionLevel ?? 3}>
            {Object.entries(CONDITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Frequency">
            <Select name="frequency" defaultValue={client?.frequency ?? "one-time"}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every two weeks</option>
              <option value="monthly">Monthly</option>
              <option value="one-time">One time</option>
            </Select>
          </Field>
          <Field label="Agreed rate ($)">
            <Input
              name="rate"
              type="number"
              step="0.01"
              min={0}
              defaultValue={client?.rate != null ? (client.rate / 100).toFixed(2) : ""}
            />
          </Field>
        </div>

        <Field label="Status">
          <Select name="status" defaultValue={client?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="former">Former</option>
          </Select>
        </Field>

        <Field
          label="Notes"
          hint="Pets, problem areas, parking, anything the crew should know."
        >
          <Textarea name="notes" rows={4} defaultValue={client?.notes ?? ""} />
        </Field>

        <Button type="submit" size="lg" className="w-full">
          {client ? "Save changes" : "Add client"}
        </Button>
      </div>
    </form>
  );
}
