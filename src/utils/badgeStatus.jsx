export default function StatusIndicator({ status }){
    const getStatusColor = () => {
      switch (status) {
        case 'disponivel':
          return '#28a745'; // Verde
        case 'ocupado':
          return '#dc3545'; // Vermelho
        case 'indisponível':
          return '#6c757d'; // Cinza
        default:
          return '#6c757d';
      }
    };

    return (
      <div className="d-flex align-items-center">
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            marginRight: '8px'
          }}
        />
        <span className="text-capitalize">{status || 'indisponível'}</span>
      </div>
    );
  };
