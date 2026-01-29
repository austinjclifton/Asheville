import { useEffect, useState } from "react";
import { Container, Typography, Paper, CircularProgress } from "@mui/material";

function HealthCheck() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ ok: false, service: "Backend not connected" }));
  }, []);

  return (
    <Container sx={{ mt: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Team Asheville
        </Typography>

        {!status ? (
          <CircularProgress />
        ) : (
          <>
            <Typography>
              Backend service: <strong>{status.service}</strong>
            </Typography>
            <Typography>Status: {status.ok ? "OK" : "ERROR"}</Typography>
            {status.time && <Typography>Server time: {status.time}</Typography>}
          </>
        )}
      </Paper>
    </Container>
  );
}

export default HealthCheck;