export interface IBodyMeasurementItem {
  id: string;
  user_id: string;
  weight_kg: number;
  height_cm: number | null;
  measured_at: string;
  created_at: string;
  arm_cm?: number | null;
  chest_cm?: number | null;
  waist_cm?: number | null;
  hips_cm?: number | null;
  thigh_cm?: number | null;
  calf_cm?: number | null;
}
