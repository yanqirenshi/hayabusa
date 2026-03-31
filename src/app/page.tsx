import SystemArchitectureRenderer from "@/components/SystemArchitectureRenderer";

export default function Home() {
  return (
    <div style={{ padding: "40px", textAlign: "center", minHeight: "100vh" }}>
      <h1 style={{ fontWeight: 600, fontSize: "2rem", marginBottom: "0.5rem" }}>
        Hayabusa System Architecture
      </h1>
      <p style={{ marginBottom: "2rem", color: "#666" }}>
        Data Pipeline, Data Model, and Infrastructure Visualization
      </p>
      
      <main>
        <SystemArchitectureRenderer />
      </main>
    </div>
  );
}
