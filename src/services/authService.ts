import Cookies from 'js-cookie';
import { httpService } from '../services/http';

class LoginUtils {
  setToken (token: string) {
    httpService.setAuthToken(token);
  }

  isLogged () {
    // 先判斷 cookie 是否有從B端身份識別中心登入
    const token = Cookies.get('justkaB');
    if (token) {
      this.setToken(token);
      return true;
    } else {
      this.logout();
      return false;
    }
  }

  logout() {
    const domain = import.meta.env.VITE_DOMAIN;
    Cookies.remove('justkaB', { path: '/', domain: domain });
    // TODO... 這邊還要思考要如何清除, 中台, 訂閱服務平台 的相關cooiec或local storage,
    // 例如中台有 menuItems, userInfo 等等的瀏覽器資料要清
  }

}

const loginUtils = new LoginUtils();
export default loginUtils;
