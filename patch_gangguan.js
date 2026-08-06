const fs = require('fs');
const path = 'Frontend/src/components/ui/GangguanDetailModal.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { X, Edit2, Trash2, Loader2, Save } from 'lucide-react'\nimport { useNavigate } from 'react-router-dom'",
  "import { X, Edit2, Trash2, Loader2, Save } from 'lucide-react'\nimport useDirtyFormGuard from '@/hooks/useDirtyFormGuard'\nimport { useNavigate } from 'react-router-dom'"
);
content = content.replace(
  "import { X, Edit2, Trash2, Loader2, Save } from 'lucide-react'\r\nimport { useNavigate } from 'react-router-dom'",
  "import { X, Edit2, Trash2, Loader2, Save } from 'lucide-react'\r\nimport useDirtyFormGuard from '@/hooks/useDirtyFormGuard'\r\nimport { useNavigate } from 'react-router-dom'"
);

content = content.replace(
  "  const [editRowForm, setEditRowForm] = useState({ merek: '', tahun_alat: '', nomor_seri: '' })\n  const [savingSwitching, setSavingSwitching] = useState(false)",
  "  const [editRowForm, setEditRowForm] = useState({ merek: '', tahun_alat: '', nomor_seri: '' })\n\n  const { isDirty, setIsDirty } = useDirtyFormGuard();\n  const handleFieldChange = (field, value) => {\n    setEditRowForm(prev => ({ ...prev, [field]: value }));\n    setIsDirty(true);\n  };\n\n  const [savingSwitching, setSavingSwitching] = useState(false)"
);
content = content.replace(
  "  const [editRowForm, setEditRowForm] = useState({ merek: '', tahun_alat: '', nomor_seri: '' })\r\n  const [savingSwitching, setSavingSwitching] = useState(false)",
  "  const [editRowForm, setEditRowForm] = useState({ merek: '', tahun_alat: '', nomor_seri: '' })\r\n\r\n  const { isDirty, setIsDirty } = useDirtyFormGuard();\r\n  const handleFieldChange = (field, value) => {\r\n    setEditRowForm(prev => ({ ...prev, [field]: value }));\r\n    setIsDirty(true);\r\n  };\r\n\r\n  const [savingSwitching, setSavingSwitching] = useState(false)"
);

content = content.replace(
  "  const startEditRow = (det) => {\n    setEditingRowId(det.id)\n    setEditRowForm({ merek: det.merek || '', tahun_alat: det.tahun_alat || '', nomor_seri: det.nomor_seri || '' })\n    setDeletingRowId(null)\n  }",
  "  const startEditRow = (det) => {\n    setEditingRowId(det.id)\n    setEditRowForm({ merek: det.merek || '', tahun_alat: det.tahun_alat || '', nomor_seri: det.nomor_seri || '' })\n    setIsDirty(false)\n    setDeletingRowId(null)\n  }"
);
content = content.replace(
  "  const startAddRow = () => {\n    setEditingRowId('new')\n    setEditRowForm({ merek: '', tahun_alat: '', nomor_seri: '' })\n    setDeletingRowId(null)\n  }",
  "  const startAddRow = () => {\n    setEditingRowId('new')\n    setEditRowForm({ merek: '', tahun_alat: '', nomor_seri: '' })\n    setIsDirty(false)\n    setDeletingRowId(null)\n  }"
);
content = content.replace(
  "  const closeModal = () => {\n    onOpenChange(false)\n  }",
  "  const closeModal = async () => {\n    if (editingRowId && isDirty) {\n      const result = await notify.confirmLeave();\n      if (!result.isConfirmed) return;\n    }\n    setIsDirty(false)\n    onOpenChange(false)\n  }"
);

content = content.replace(
  "  const startEditRow = (det) => {\r\n    setEditingRowId(det.id)\r\n    setEditRowForm({ merek: det.merek || '', tahun_alat: det.tahun_alat || '', nomor_seri: det.nomor_seri || '' })\r\n    setDeletingRowId(null)\r\n  }",
  "  const startEditRow = (det) => {\r\n    setEditingRowId(det.id)\r\n    setEditRowForm({ merek: det.merek || '', tahun_alat: det.tahun_alat || '', nomor_seri: det.nomor_seri || '' })\r\n    setIsDirty(false)\r\n    setDeletingRowId(null)\r\n  }"
);
content = content.replace(
  "  const startAddRow = () => {\r\n    setEditingRowId('new')\r\n    setEditRowForm({ merek: '', tahun_alat: '', nomor_seri: '' })\r\n    setDeletingRowId(null)\r\n  }",
  "  const startAddRow = () => {\r\n    setEditingRowId('new')\r\n    setEditRowForm({ merek: '', tahun_alat: '', nomor_seri: '' })\r\n    setIsDirty(false)\r\n    setDeletingRowId(null)\r\n  }"
);
content = content.replace(
  "  const closeModal = () => {\r\n    onOpenChange(false)\r\n  }",
  "  const closeModal = async () => {\r\n    if (editingRowId && isDirty) {\r\n      const result = await notify.confirmLeave();\r\n      if (!result.isConfirmed) return;\r\n    }\r\n    setIsDirty(false)\r\n    onOpenChange(false)\r\n  }"
);

content = content.replace(
  "        // Update existing\n        await api.put(`/v1/gangguan-switching/detail/${editingRowId}`, editRowForm)\n      }\n      \n      setEditingRowId(null)",
  "        // Update existing\n        await api.put(`/v1/gangguan-switching/detail/${editingRowId}`, editRowForm)\n      }\n      \n      setIsDirty(false)\n      setEditingRowId(null)"
);
content = content.replace(
  "        // Update existing\n        await api.put(`/v1/gangguan-trafo/detail/${editingRowId}`, editRowForm)\n      }\n      \n      setEditingRowId(null)",
  "        // Update existing\n        await api.put(`/v1/gangguan-trafo/detail/${editingRowId}`, editRowForm)\n      }\n      \n      setIsDirty(false)\n      setEditingRowId(null)"
);

content = content.replace(
  "        // Update existing\r\n        await api.put(`/v1/gangguan-switching/detail/${editingRowId}`, editRowForm)\r\n      }\r\n      \r\n      setEditingRowId(null)",
  "        // Update existing\r\n        await api.put(`/v1/gangguan-switching/detail/${editingRowId}`, editRowForm)\r\n      }\r\n      \r\n      setIsDirty(false)\r\n      setEditingRowId(null)"
);
content = content.replace(
  "        // Update existing\r\n        await api.put(`/v1/gangguan-trafo/detail/${editingRowId}`, editRowForm)\r\n      }\r\n      \r\n      setEditingRowId(null)",
  "        // Update existing\r\n        await api.put(`/v1/gangguan-trafo/detail/${editingRowId}`, editRowForm)\r\n      }\r\n      \r\n      setIsDirty(false)\r\n      setEditingRowId(null)"
);

content = content.replace(/onChange=\{\(e\) => setEditRowForm\(\{ \.\.\.editRowForm, merek: e\.target\.value \}\)\}/g, "onChange={(e) => handleFieldChange('merek', e.target.value)}");
content = content.replace(/onChange=\{\(e\) => setEditRowForm\(\{ \.\.\.editRowForm, tahun_alat: e\.target\.value \}\)\}/g, "onChange={(e) => handleFieldChange('tahun_alat', e.target.value)}");
content = content.replace(/onChange=\{\(e\) => setEditRowForm\(\{ \.\.\.editRowForm, nomor_seri: e\.target\.value \}\)\}/g, "onChange={(e) => handleFieldChange('nomor_seri', e.target.value)}");

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
