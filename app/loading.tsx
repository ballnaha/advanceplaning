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
        <div
          className="planning-loading-spinner"
          aria-hidden="true"
          style={{ margin: '0 auto 20px' }}
        />
        <div style={{ fontSize: 20, fontWeight: 800 }}>กำลังโหลดข้อมูลแผนการผลิต</div>
        <div style={{ marginTop: 8, color: '#64748b', fontSize: 14 }}>
          ระบบกำลังอ่านข้อมูลและจัดเตรียมคิวงาน
        </div>
      </div>
    </div>
  );
}
