<template>
  <compModal class="TeamSettingModal"
    v-model="isOpenModal"
    :title="mode === 'edit' ? '編輯團隊' : '新增團隊'"
    width="476px"
    height="auto"
    :showClose="true"
    :closeOnMask="false"
    @close="close"
  >
    <div class="mb-3" v-if="!isLoading">
      <!-- 團隊名稱 -->
      <div class="mb-2">
        <label for="team-name">團隊名稱<span class="fc-red-1 ml-1">必填</span></label>
        <div class="team-name-box mt-1">
          <input class="custom-input" style="flex: 1;"
            type="text"
            id="team-name"
            name="team-name"
            maxlength="20"
            v-model="teamName"
            placeholder="團隊名稱"/>
          <i class="material-symbols-outlined material-fill clear-trigger-icon"
            v-if="teamName"
            @click="teamName = ''">close</i>
        </div>
      </div>

      <!-- 團隊類型 -->
      <div class="mb-3">
        <div class="form-label">團隊類型<span class="fc-red-1 ml-1">必填</span></div>
        <div class="mt-1" :class="{ 'dropdown-disabled': mode === 'edit' }">
          <compDropDown
            :options="teamTypeOptions"
            :defaultValue="selectedTeamType"
            placeholder="請選擇團隊類型"
            width="100%"
            :showClearTriggerIcon="false"
            @select="(opt) => { selectedTeamType = String(opt.value) }"
          />
        </div>
      </div>

      <!-- 邀請協作帳號 -->
      <div v-if="mode === 'create'">
        <div class="form-label">邀請協作帳號</div>
        <div class="invite-list mt-1">
          <div class="invite-row" v-for="(invite, i) in inviteList" :key="i">
            <div class="invite-email-box">
              <label class="invite-sub-label" :for="`invite-email-${i}`">E-mail</label>
              <div class="invite-input-wrap">
                <input class="custom-input"
                  type="email"
                  :id="`invite-email-${i}`"
                  v-model="invite.email"
                  placeholder="輸入 E-mail"/>
                <i class="material-symbols-outlined material-fill clear-trigger-icon"
                  v-if="invite.email"
                  @click="invite.email = ''">close</i>
              </div>
            </div>
            <div class="invite-role-box">
              <div class="invite-sub-label">選擇職位</div>
              <compDropDown
                :options="roleOptions"
                :defaultValue="invite.role"
                placeholder="請選擇"
                width="100%"
                :showClearTriggerIcon="false"
                @select="(opt) => { invite.role = String(opt.value) }"
              />
            </div>
            <i class="material-symbols-outlined invite-remove-btn"
              v-tooltip="'移除'"
              @click="removeInvite(i)">delete</i>
          </div>
        </div>
        <button class="custom-btn add-invite-btn mt-2" @click="addInvite">
          <i class="material-symbols-outlined">add</i>再邀請一位
        </button>
      </div>
    </div>

    <div class="p-2 text-center fc-grey-2" v-if="isLoading">
      <i class="material-symbols-outlined loading-spinner fs-26">progress_activity</i>
    </div>
    <template #footer>
      <button class="custom-btn" v-if="!isLoading" @click="close()">取消</button>
      <button class="custom-btn custom-main-btn" v-if="!isLoading"
        :disabled="!teamName || !selectedTeamType || !isInviteValid"
        @click="saveTeam()">{{ mode === 'edit' ? '儲存' : '建立' }}</button>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import popDialog from '@/services/popDialog';
import compModal from '@/components/compModal/compModal.vue';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import type { DropDownOption } from '@/components/compDropDown/compDropDown.vue';

const props = defineProps<{
  modelValue: boolean; // 控制 Modal 顯示
  mode?: 'create' | 'edit'; // 模式，預設為 'create
  teamId?: string; // 編輯模式時使用
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const isOpenModal = ref(props.modelValue);
const mode = ref(props.mode ?? 'create');
const isLoading = ref(false);
const teamName = ref('');
const selectedTeamType = ref('');

// TODO... 之後呼叫 API 取得團隊類型資料
const teamTypeOptions: DropDownOption[] = [
  { name: '團隊類型一', value: 'type1' },
  { name: '團隊類型二', value: 'type2' },
  { name: '團隊類型三', value: 'type3' },
];

// TODO... 之後呼叫 API 取得職位資料
const roleOptions: DropDownOption[] = [
  { name: '請選擇', value: ''},
  { name: '團隊主管', value: 'manager' },
  { name: '團隊成員', value: 'member' },
  { name: '訪客', value: 'guest' },
];

interface InviteItem {
  email: string;
  role: string;
}

const inviteList = ref<InviteItem[]>([{ email: '', role: '' }]);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 邀請列表驗證：有任何一欄有填寫，則 email 格式 + 職位都必須完整
const isInviteValid = computed(() => {
  return inviteList.value.every(invite => {
    const hasEmail = invite.email.trim() !== '';
    const hasRole = invite.role !== '';
    if (!hasEmail && !hasRole) return true; // 空的允許
    return isValidEmail(invite.email) && hasRole;
  });
});

// 新增邀請
function addInvite() {
  inviteList.value.push({ email: '', role: '' });
}

// 移除邀請
function removeInvite(i: number) {
  inviteList.value.splice(i, 1);
}

// 重置
function resetForm() {
  teamName.value = '';
  selectedTeamType.value = '';
  // 預設一筆空的邀請資料
  inviteList.value = [{ email: '', role: '' }];
}

function close() {
  emit("update:modelValue", false);
  isOpenModal.value = false;
}

async function getTeamInfo() {
  // TODO... ajax
  console.log('載入團隊資料', props.teamId);
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000));
  isLoading.value = false;
  // 模擬填入資料
  teamName.value = '範例團隊';
  selectedTeamType.value = 'type1';
  inviteList.value = [{ email: 'jenny@gmail.com', role: 'manager' }];
}

// 儲存團隊設定
async function saveTeam() {
  // 儲存前檢查是否有重複的 E-mail
  const filledEmails = inviteList.value
    .map(invite => invite.email.trim().toLowerCase())
    .filter(email => email !== '');
  const hasDuplicateEmail = filledEmails.length !== new Set(filledEmails).size;
  if (hasDuplicateEmail) {
    popDialog.alert('邀請協作帳號中有重複的 E-mail，請確認後再送出。');
    return;
  }

  // TODO... ajax
  console.log(mode.value === 'edit' ? '儲存團隊' : '建立團隊', {
    teamName: teamName.value,
    teamType: selectedTeamType.value,
    inviteList: inviteList.value,
  });
  close();
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      mode.value = props.mode ?? 'create';
      if (mode.value === 'edit') {
        getTeamInfo();
      } else {
        resetForm();
      }
      emit("update:modelValue", true);
      isOpenModal.value = true;
    } else {
      emit("update:modelValue", false);
      isOpenModal.value = false;
    }
  },
  { immediate: true }
);
</script>

<style lang="scss">
.TeamSettingModal {
  .team-name-box {
    position: relative;
    display: flex;
    align-items: center;

    .custom-input {
      padding-right: 2rem;
    }

    .clear-trigger-icon {
      position: absolute;
      right: 8px;
      font-size: 20px;
      cursor: pointer;
      color: var(--color-text-alpha50);
    }
  }

  .invite-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .invite-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }

  .invite-email-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: relative;

    .invite-input-wrap {
      position: relative;
      display: flex;
      align-items: center;

      .custom-input {
        width: 100%;
        padding-right: 2rem;
      }

      .clear-trigger-icon {
        position: absolute;
        right: 8px;
        font-size: 18px;
        cursor: pointer;
        color: var(--color-text-alpha50);
      }
    }
  }

  .invite-remove-btn {
    align-self: flex-end;
    margin-bottom: 3px;
    font-size: 24px;
    color: var(--color-text-alpha50);
    flex-shrink: 0;
    border-radius: 10px;
    padding: 6px;
    cursor: pointer;
    &:hover {
      background-color: var(--color-background-2-alpha20);
    }
  }

  .invite-role-box {
    width: 140px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .invite-sub-label {
    font-size: 14px;
    color: var(--color-text-1);
  }

  .dropdown-disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  .add-invite-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;

    i {
      font-size: 18px;
    }
  }
}
</style>
