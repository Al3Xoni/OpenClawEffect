export default function TestPage() { 
  return (
    <div style={{
      background: "black", 
      color: "#00F0FF", 
      padding: "100px", 
      fontFamily: "monospace",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <h1 style={{fontSize: "3rem", border: "2px solid #00F0FF", padding: "20px"}}>
        [SYSTEM STATUS: OK]
      </h1>
      <p style={{marginTop: "20px", fontSize: "1.2rem"}}>
        Vercel Routing is functional. The app folder is active.
      </p>
      <p style={{color: "#666", fontSize: "0.8rem"}}>
        Route: /test
      </p>
    </div>
  ); 
}