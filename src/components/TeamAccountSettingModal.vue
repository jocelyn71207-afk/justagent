<template>
  <compModal class="TeamAccountSettingModal"
    v-model="isOpenModal"
    :title="mode === 'edit' ? '編輯協作帳號' : '新增協作帳號'"
    width="665px"
    height="auto"
    :showClose="true"
    :closeOnMask="false"
    @close="close"
  >
    <div class="mb-3" v-if="!isLoading">

      <!-- 編輯模式 -->
      <template v-if="mode === 'edit'">
        <div class="edit-row">
          <div class="edit-field">
            <div class="form-label">E-mail</div>
            <div class="edit-email-text mt-1">{{ editDataModel.email }}</div>
          </div>
          <div class="edit-field">
            <div class="form-label">選擇職位</div>
            <div class="mt-1">
              <compDropDown
                :options="roleOptions"
                :defaultValue="editDataModel.role"
                placeholder="請選擇"
                width="100%"
                :showClearTriggerIcon="false"
                @select="(opt) => { editDataModel.role = String(opt.value) }"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- 新增模式 -->
      <template v-else>
        <div class="invite-list">
          <!-- 欄位標籤只在最上面顯示一次，不用每一行都重複同樣的「E-mail」「選擇職位」 -->
          <div class="invite-col-headers">
            <div class="invite-fields">
              <span class="invite-sub-label">E-mail</span>
              <span class="invite-sub-label">選擇職位</span>
            </div>
            <span class="invite-remove-spacer"></span>
          </div>
          <div class="invite-row" v-for="(item, i) in inviteList" :key="i">
            <div class="invite-fields">
              <div class="invite-email-box">
                <div class="invite-input-wrap">
                  <input class="custom-input"
                    type="email"
                    :aria-label="`E-mail ${i + 1}`"
                    v-model="item.email"
                    @blur="item.touched = true"
                    placeholder="請填寫E-mail"/>
                  <i class="material-symbols-outlined material-fill clear-trigger-icon"
                    v-if="item.email"
                    @click="item.email = ''">close</i>
                </div>
                <div class="invite-field-error" v-if="item.touched && item.email && !isValidEmail(item.email)">
                  Email 格式不正確
                </div>
              </div>
              <div class="invite-role-box">
                <compDropDown
                  :options="roleOptions"
                  :defaultValue="item.role"
                  placeholder="請選擇"
                  width="100%"
                  :showClearTriggerIcon="false"
                  @select="(opt) => {
                    item.role = String(opt.value)
                  }"
                />
              </div>
            </div>
            <i class="material-symbols-outlined invite-remove-btn" v-if="inviteList.length > 1"
              v-tooltip="'移除'"
              @click="removeInvite(i)">delete</i>
          </div>
        </div>
        <button class="custom-btn add-invite-btn mt-2" v-if="mode === 'create'"
          @click="addInvite">
          <i class="material-symbols-outlined">add</i>再新增一位
        </button>
      </template>

    </div>

    <div class="p-2 text-center fc-grey-2" v-if="isLoading">
      <i class="material-symbols-outlined loading-spinner fs-26">progress_activity</i>
    </div>

    <template #footer>
      <template v-if="!isLoading">
        <!-- 編輯模式 footer -->
        <template v-if="mode === 'edit'">
          <button class="custom-btn delete-account-btn" @click="deleteAccount()">刪除此帳號</button>
          <button class="custom-btn custom-main-btn"
            :disabled="!editDataModel.role"
            @click="saveEdit">完成</button>
        </template>
        <!-- 新增模式 footer -->
        <template v-else>
          <button class="custom-btn" @click="() => close()">取消</button>
          <button class="custom-btn custom-main-btn"
            :disabled="!isInviteValid"
            @click="saveCreate">新增</button>
        </template>
      </template>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import popDialog from '@/services/popDialog';
import compModal from '@/components/compModal/compModal.vue';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import type { DropDownOption } from '@/components/compDropDown/compDropDown.vue';

const props = defineProps<{
  modelValue: boolean;
  mode?: 'create' | 'edit';
  editData?: any;  // 編輯模式時使用的資料格式
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'closeCallback', research: boolean): void; // modal關閉回調，參數表示是否需要重新送出查詢資料
}>();

const isOpenModal = ref(props.modelValue);
const mode = ref(props.mode ?? 'create');
const isLoading = ref(false);
const editDataModel = ref(props.editData ?? null); // 編輯模式的資料 TODO... 之後依實際資料結構調整

// TODO... 之後呼叫 API 取得職位資料
const roleOptions: DropDownOption[] = [
  { name: '團隊主管', value: '團隊主管' },
  { name: '專案人員', value: '專案人員' },
  { name: '檢視者', value: '檢視者' },
];

// --- 新增模式 ---
interface InviteItem {
  email: string;
  role: string;
  touched: boolean; // 是否已經 blur 過，控制格式錯誤訊息何時顯示
}

// 簡單的 email 格式驗證
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 新增模式: 邀請列表，初始一筆空資料
const inviteList = ref<InviteItem[]>([{ email: '', role: '', touched: false }]);

// 新增模式: 新增一筆邀請資料
function addInvite() {
  inviteList.value.push({ email: '', role: '', touched: false });
}

// 新增模式: 移除邀請資料
function removeInvite(i: number) {
  if (inviteList.value.length === 1) return;
  inviteList.value.splice(i, 1);
}

// 新增模式: 邀請列表驗證 - 有任何一筆資料有填寫，則該筆資料的 email 格式和職位都必須完整
const isInviteValid = computed(() => {
  if (inviteList.value.length === 0) return false;
  return inviteList.value.every(invite => isValidEmail(invite.email) && invite.role !== '');
});

// 儲存新增
async function saveCreate() {
  const emails = inviteList.value.map(i => i.email.trim().toLowerCase());
  const hasDuplicate = emails.length !== new Set(emails).size;
  if (hasDuplicate) {
    popDialog.alert('有重複的 E-mail，請確認後再送出。');
    return;
  }
  // TODO... ajax
  console.log('新增協作帳號', inviteList.value);
  close(true);
}


// --- 編輯模式 ---
function resetForm() {
  inviteList.value = [{ email: '', role: '', touched: false }];
}

// 編輯模式: 刪除協作帳號
function deleteAccount() {
  popDialog.confirm('確定刪除嗎？', () => {
    close(true);
  });
}

// 儲存編輯
async function saveEdit() {
  // TODO... ajax
  console.log('儲存協作帳號', editDataModel.value);
  close(true);
}

// 關閉 modal，並觸發關閉回調
function close(research = false) {
  emit('update:modelValue', false);
  emit('closeCallback', research);
  isOpenModal.value = false;
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      mode.value = props.mode ?? 'create';
      resetForm();
      if (mode.value === 'edit') {
        editDataModel.value = props.editData ?? null;
      }
      emit('update:modelValue', true);
      isOpenModal.value = true;
    } else {
      emit('update:modelValue', false);
      isOpenModal.value = false;
    }
  },
  { immediate: true }
);
</script>

<style lang="scss">
.TeamAccountSettingModal {
  .edit-row {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .edit-field {
    width: 50%;
  }

  .edit-email-text {
    font-size: 14px;
    color: var(--color-text);
    padding: 0.532rem 0rem;
    word-wrap: break-word;
  }

  .invite-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  // 欄位標籤只出現在這一行，跟下面每一行的欄位寬度共用同一套
  // .invite-fields 版面，才能對齊
  .invite-col-headers {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .invite-remove-spacer {
    width: 36px;
    flex-shrink: 0;
  }

  .invite-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .invite-fields {
    display: flex;
    flex: 1;
    gap: 12px;
    min-width: 0;
  }

  .invite-email-box {
    width: 50%;
    display: flex;
    flex-direction: column;

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

  .invite-role-box {
    width: 50%;
    display: flex;
    flex-direction: column;
  }

  .invite-sub-label {
    width: 50%;
    font-size: 14px;
    color: var(--color-text);
  }

  .invite-field-error {
    font-size: 12.5px;
    color: var(--danger);
    margin-top: 4px;
  }

  .invite-remove-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: var(--color-text-alpha50);
    flex-shrink: 0;
    border-radius: 10px;
    cursor: pointer;
    &:hover {
      background-color: var(--color-background-2-alpha20);
    }
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

  .delete-account-btn {
    margin-right: auto; // 推到最左側
  }
}
</style>
