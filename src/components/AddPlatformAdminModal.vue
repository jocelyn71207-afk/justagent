<template>
  <compModal class="AddPlatformAdminModal"
    v-model="isOpenModal"
    :title="'新增系統管理員'"
    width="476px"
    height="auto"
    :showClose="true"
    :closeOnMask="false"
    @close="close"
  >
    <div class="mb-3">
      <div class="d-flex flex-align-start fs-14 fc-grey-1 mb-2">
        <i class="material-symbols-outlined fs-19 mr-1">info</i>
        只能選擇已在企業下的 Email 帳號，如不在清單中，請先邀請對方加入企業後再設定為系統管理員。
      </div>
      <div class="account-list">
        <div class="account-row" v-for="(item, i) in accountList" :key="i">
          <div class="account-select-box">
            <div class="form-label">選擇帳號</div>
            <compAutocomplete
              :options="accountOptions"
              :defaultValue="item.accountLabel"
              placeholder="選擇帳號"
              width="100%"
              @select="(opt) => { item.accountId = String(opt.value); item.accountLabel = opt.label }"
              @input="(val) => { item.accountLabel = val; if (!val) item.accountId = ''; }"
            />
          </div>
          <i class="material-symbols-outlined remove-btn" v-if="accountList.length > 1"
            v-tooltip="'移除'"
            @click="removeAccount(i)">delete</i>
        </div>
      </div>
      <button class="custom-btn add-btn mt-2" @click="addAccount">
        <i class="material-symbols-outlined">add</i>再新增一位
      </button>
    </div>

    <template #footer>
      <button class="custom-btn" @click="close()">取消</button>
      <button class="custom-btn custom-main-btn"
        :disabled="!isValid"
        @click="save()">新增</button>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import popDialog from '@/services/popDialog';
import compModal from '@/components/compModal/compModal.vue';
import compAutocomplete from '@/components/compAutocomplete/compAutocomplete.vue';
import type { AutocompleteOption } from '@/components/compAutocomplete/compAutocomplete.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const isOpenModal = ref(props.modelValue);

// 可選帳號列表（API 回傳時已排除現有管理者）
const accountOptions = ref<AutocompleteOption[]>([]);

// TODO... 之後呼叫 API 取得帳號列表
async function fetchAccountOptions() {
  // TODO... ajax
  accountOptions.value = [
    { label: 'jenny@gmail.com', value: 'acc1' },
    { label: 'tom@gmail.com', value: 'acc3' },
  ];
}

interface AccountItem {
  accountId: string;
  accountLabel: string;
}

// 新增系統管理員的帳號列表
const accountList = ref<AccountItem[]>([{ accountId: '', accountLabel: '' }]);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const isValid = computed(() => {
  return accountList.value.length > 0 && accountList.value.every(item =>
    item.accountLabel.trim() !== '' && isValidEmail(item.accountLabel)
  );
});

function addAccount() {
  accountList.value.push({ accountId: '', accountLabel: '' });
}

function removeAccount(i: number) {
  accountList.value.splice(i, 1);
}

function resetForm() {
  accountList.value = [{ accountId: '', accountLabel: '' }];
}

function close() {
  emit("update:modelValue", false);
  isOpenModal.value = false;
}

async function save() {
  // 檢查是否有重複的Email
  const labels = accountList.value.map(item => item.accountLabel.trim().toLowerCase());
  const hasDuplicate = labels.length !== new Set(labels).size;
  if (hasDuplicate) {
    popDialog.alert('有重複的 Email，請確認後再送出。');
    return;
  }
  // 檢查帳號 Email 是否都在可選清單中
  const optionLabels = new Set(accountOptions.value.map(o => o.label.trim().toLowerCase()));
  const notInOptions = labels.filter(label => !optionLabels.has(label));
  if (notInOptions.length) {
    popDialog.alert(`以下 Email 不在可選清單中，請重新選擇：<br>${notInOptions.join('<br>')}`);
    return;
  }

  // TODO... ajax
  console.log('新增系統管理員', accountList.value);
  close();
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      resetForm();
      fetchAccountOptions();
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
.AddPlatformAdminModal {
  .account-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .account-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .account-select-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .remove-btn {
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

  .add-btn {
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
