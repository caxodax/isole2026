import React from 'react';

export default function AppointmentList({ appointments }) {
  return (
    <div>
      <h3>Citas recibidas</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>WhatsApp</th>
            <th>Servicio</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.whatsapp}</td>
              <td>{a.serviceType}</td>
              <td>{a.date}</td>
            </tr>
          ))}
          {appointments.length === 0 && (
            <tr>
              <td colSpan="4" style={{ fontSize: '0.85rem' }}>
                Todavía no hay citas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
