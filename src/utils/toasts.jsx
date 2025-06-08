import { toast } from "react-toastify";

export const notifySucess = (msg) => toast.success(msg);
export const notifyError = (msg) => toast.error(msg);

export const showConfirmationToast = (message, onConfirm, onCancel) => {
  toast.info(
    ({ closeToast }) => (
      <div style={{marginTop: '1rem'}}>
        <p>{message}</p>
        <div style={{display: 'flex', justifyContent: 'space-around'}}>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              closeToast();
            }}
            style={{
              padding: '3px 9px',
              backgroundColor: 'green',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sim
          </button>
          <button
          type="button"
            onClick={() => {
              if (onCancel) onCancel();
              closeToast();
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: 'gray',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    ),
    {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      draggable: false,
    }
  );
};