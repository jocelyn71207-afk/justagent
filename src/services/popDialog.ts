// 將 vue-sweetalert2 重新包成 service 方便使用
import Swal from 'sweetalert2'

const popDialog = {
  // alert: 支援兩種呼叫：
  // 1) alert(msg)
  // 2) alert(msg, '自訂文字', callback)
  // 3) alert(msg, callback)  // 跳過第二參數
  alert: (
    msg: string,
    btnTextOrCallback?: string | (() => void),
    confirmCallback: () => void = () => {},
  ) => {
    const btnText = typeof btnTextOrCallback === 'string' ? btnTextOrCallback : '確定';
    const callback = typeof btnTextOrCallback === 'function' ? btnTextOrCallback : confirmCallback;

    return Swal.fire({
      html: msg,
      confirmButtonText: btnText,
    }).then(() => {
      if (callback) {
        callback();
      }
    });
  },

  // confirm: 支援跳過第 2,3 參數
  // 1) confirm(msg)
  // 2) confirm(msg, confirmCb) // 跳過文字
  // 3) confirm(msg, confirmBtnText, cancelBtnText, confirmCb, cancelCb)
  confirm: (
    msg: string,
    confirmBtnTextOrCallback?: string | (() => void),
    cancelBtnTextOrCallback?: string | (() => void),
    confirmCallback: () => void = () => {},
    cancelCallback: () => void = () => {},
  ) => {
    const confirmBtnText = typeof confirmBtnTextOrCallback === 'string' ? confirmBtnTextOrCallback : '確定';
    const cancelBtnText = typeof cancelBtnTextOrCallback === 'string' ? cancelBtnTextOrCallback : '取消';
    const confirmCb = typeof confirmBtnTextOrCallback === 'function' ? confirmBtnTextOrCallback : confirmCallback;
    const cancelCb = typeof cancelBtnTextOrCallback === 'function' ? cancelBtnTextOrCallback : cancelCallback;

    return Swal.fire({
      html: msg,
      confirmButtonText: confirmBtnText,
      cancelButtonText: cancelBtnText,
      showCancelButton: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      reverseButtons: true,
    }).then((result) => {
      if (result) {
        if (result.isConfirmed) {
          confirmCb();
        } else if (result.isDismissed) {
          cancelCb();
        }
      }
    });
  },

  // Toast（有排隊）
  toast: (() => {
    const queue: { msg: string; duration: number }[] = [];
    let showing = false;
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timerProgressBar: true,
      customClass: { popup: 'pop-toast' },
    });

    const showNext = () => {
      if (showing || queue.length === 0) return;
      showing = true;
      const { msg, duration } = queue.shift()!;
      Toast.fire({ title: msg, timer: duration }).finally(() => {
        showing = false;
        showNext();
      });
    };

    return (msg: string, duration = 1000) => {
      queue.push({ msg, duration });
      showNext();
    };
  })(),

}

export default popDialog
