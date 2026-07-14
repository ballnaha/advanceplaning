export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: '#f8fafc',
        color: '#172033',
      }}
    >
      <div style={{ width: 'min(420px, 100%)', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>กำลังโหลดข้อมูลแผนการผลิต</div>
        <div style={{ marginTop: 8, color: '#64748b', fontSize: 14 }}>
          ระบบกำลังอ่านข้อมูลและจัดเตรียมคิวงาน
        </div>
        <div
          aria-hidden="true"
          style={{
            height: 4,
            marginTop: 20,
            overflow: 'hidden',
            borderRadius: 999,
            background: '#e2e8f0',
          }}
        >
          <div
            style={{
              width: '45%',
              height: '100%',
              borderRadius: 999,
              background: '#4f46e5',
            }}
          />
        </div>
      </div>
    </div>
  );
}
