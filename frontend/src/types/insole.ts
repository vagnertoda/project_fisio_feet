export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface Patient {
  id: number;
  user_id: number;
  name: string;
  age?: number;
  foot_size?: string;
  notes?: string;
  created_at: string;
  scans?: FootScan[];
  projects?: InsoleProject[];
}

export interface FootScan {
  id: number;
  patient_id: number;
  file_path: string;
  file_format: string;
  upload_date: string;
  file_size: number;
}

export type OrthopedicComponentType =
  | 'arco_suporte'
  | 'amortecedor_calcaneo'
  | 'piloto_metatarso'
  | 'cunha_pronacao'
  | 'cunha_supinacao'
  | 'estimulo_proprioceptivo'
  | 'placa_pressao';

export interface OrthopedicComponent {
  id: string; // client UUID or DB id string
  db_id?: number;
  component_type: OrthopedicComponentType;
  name: string;
  position_x: number; // in mm
  position_y: number; // in mm (height off base)
  position_z: number; // in mm
  height: number; // in mm
  width: number; // in mm
  depth: number; // in mm
  rotation_y?: number;
  material_type: string; // e.g., 'TPU Soft (Shore 85A)', 'TPU Medium (Shore 95A)'
  color: string;
}

export type FootSide = 'left' | 'right';

export interface InsoleProject {
  id?: number;
  foot_scan_id?: number | null;
  patient_id: number;
  project_name: string;
  foot_side: FootSide; // 'left' | 'right'
  base_thickness: number; // 2mm to 15mm
  arch_height: number; // 0mm to 20mm
  arch_width: number; // 15mm to 40mm
  status: 'Em Edição' | 'Concluído' | 'Exportado';
  created_at?: string;
  updated_at?: string;
  exported_file_path?: string;
  components: OrthopedicComponent[];
}

export type RenderMode = 'solid' | 'wireframe' | 'xray';
export type ViewpointPreset = 'perspective' | 'top' | 'lateral_medial' | 'lateral_lateral' | 'front';
