<template>
  <compModal class="ProjectSettingModal"
    v-model="isOpenModal"
    :title="'專案設定'"
    width="476px"
    height="auto"
    :showClose="true"
    :closeOnMask="false"
    @close="close"
  >
    <div class="mb-3">
      <template v-if="!isLoading">
        <!-- 專案名稱 -->
        <div class="mb-2">
          <label for="project-name">專案名稱<span class="fc-red-1 ml-1">必填</span></label>
          <div class="project-name-box mt-1">
            <input :class="['custom-input', { 'useAiGenerate': !isCreate }]" style="flex: 1;"
              type="text"
              id="project-name"
              name="project-name"
              maxlength="20"
              placeholder="輸入專案名稱"/>
            <button class="custom-btn useAiGenerate-btn" v-if="!isCreate">AI生成</button>
          </div>
          <div class="text-right fc-grey-1 fs-14" style="margin-top: 6px;">0/20</div>
        </div>
        <!-- 專案封面圖 -->
        <div class="mb-2">
          <label>專案封面圖<span class="fc-grey-1 ml-1" v-if="isCreate">如未上傳系統會自動生成</span></label>
          <!-- TODO... 等之後真實串接資料再處理 v-if 邏輯 -->
          <div class="project-cover-image-box mt-1" v-if="!isCreate">
            <img src="https://picsum.photos/410/240.webp?random=62" alt="自然風景"/>
          </div>
          <div class="project-upload-image-box">
            <button class="custom-btn w-100" @click="projectUploadInput!.click()"><i class="material-symbols-outlined">add</i>上傳圖片</button>
            <input type="file" hidden="hidden" accept=".png,.jpg,.jpeg,.gif,.bmp,.webp" ref="projectUploadInput"
              @change="uploadImg()"/>
          </div>
        </div>
        <!-- 使用的Agent -->
        <div class="mb-2">
          <label>使用的Agent<span class="fc-red-1 ml-1">必填</span></label>
          <div class="mt-1">
            <div class="useAngent-box">
              <div v-for="(item, i) in selectedAgent" :key="'selectedAgent' + item.value + i">
                <span>{{ item.label }}</span>
                <i class="material-symbols-outlined" v-tooltip="'移除'"
                  @click="removeSelectedAgent(item)">close</i>
              </div>
            </div>
            <compAutocomplete class="mt-1"
              :options="totalAgent"
              :defaultValue="serchAgentKeyword"
              placeholder="選擇Agent"
              width="100%"
              @select="setSelectedAgent"
              @input="(keyword: string) => {
                serchAgentKeyword = keyword;
              }"
            />
          </div>
        </div>
        <!-- 專案描述 -->
        <div v-if="!isCreate">
          <label for="project-description">專案描述</label>
          <div class="mt-1">
            <textarea class="custom-textarea fs-14 w-100" id="project-description" name="project-description"
              placeholder="輸入​專案​執​行目​的" rows="3"></textarea>
          </div>
        </div>
        <div class="remark" v-if="!isCreate">AI Agent會更貼切的提供您適合的答覆與協助</div>
      </template>
      <div class="p-2 text-center fc-grey-2" v-else>
        <i class="material-symbols-outlined loading-spinner fs-26">progress_activity</i>
      </div>
    </div>
    <template #footer>
      <button class="custom-btn" v-if="!isLoading"
        @click="close()">取消</button>
      <button class="custom-btn custom-main-btn" v-if="!isLoading"
        :disabled="!selectedAgent.length"
        @click="saveProjectSetting()">完成</button>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import type { Ref } from "vue";
import { httpService } from '@/services/http';
import popDialog from '@/services/popDialog';
import compModal from '@/components/compModal/compModal.vue';
import compAutocomplete from '@/components/compAutocomplete/compAutocomplete.vue';

const props = defineProps<{
  modelValue: boolean;
  projectId: string;
  isCreate?: boolean; // 是否為建立專案的設定，預設為 false
  createTeamId?: string; // 新增專案時使用的參數，表示專案是為了哪個團隊而建立的，預設為空字串
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const isOpenModal = ref(props.modelValue);
const isLoading = ref(false);

let isCreate = ref(props.isCreate ?? false);
let createTeamId = props.createTeamId ?? '';

function close() {
  emit("update:modelValue", false);
  isOpenModal.value = false;
}
const projectUploadInput = ref<HTMLInputElement | null>(null); // 上傳圖片的 input 元素引用
const serchAgentKeyword = ref(''); // 搜尋 Agent 的關鍵字

function uploadImg() {
  const file = projectUploadInput.value?.files?.[0];
  if (file) {
    // TODO... ajax
    console.log("選擇的圖片文件:", file);
    popDialog.alert("圖片上傳成功");
    projectUploadInput.value!.value = '';
  }
}

// 當前專案的Ｂ端帳號有購買的 Agent   TODO... 還要等後端提供資料格式
const totalAgent = ref([
  { label: '數據分析', value: 'agentA' },
  { label: '業務助理', value: 'agentB' },
  { label: '行銷專員員員員員員員員員員員員員員員員員員員員員員員員員員員員員員員員員員', value: 'agentC' },
  { label: '行銷主管', value: 'agentD' },
]);

// 已選擇的 Agent   TODO... 還要等後端提供資料格式
const selectedAgent = ref([]) as Ref<any[]>;

// 選擇 Agent
function setSelectedAgent(item: any) {
  // 檢查是否已選擇
  if (selectedAgent.value.some(agent => agent.value === item.value)) {
    console.log('已選擇', item);
    return;
  }
  const temp = JSON.parse(JSON.stringify(item));
  selectedAgent.value.push(temp);
  nextTick(() => {
    serchAgentKeyword.value = ''; // 選擇後清空搜尋框
  });
}
// 移除已選擇的 Agent
function removeSelectedAgent(item: any) {
  selectedAgent.value = selectedAgent.value.filter(agent => agent.value !== item.value);
}

// 取得專案資訊
async function getProjectInfo() {
  // ajax 模擬獲取
  console.log("模擬獲取資料...", props.projectId);
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬網路延遲
  isLoading.value = false;

  selectedAgent.value = [
    { label: '數據分析', value: 'agentA' },
    { label: '業務助理', value: 'agentB' },
    { label: '行銷專員員員員員員員員員員員員員員員員員員員員員員員員員員員員員員員員員員', value: 'agentC' },
  ];

}

// 儲存專案設定
async function saveProjectSetting() {
  // ajax...
  popDialog.alert("儲存成功");
  close();
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      // 如果是從關閉到開啟，且不是建立專案的設定，則獲取專案資訊
      isCreate.value = props.isCreate ?? false;
      createTeamId = props.createTeamId ?? '';
      console.log('isCreate >>> ', isCreate.value, 'createTeamId >>>> ', createTeamId);
      // TODO... 先造假if邏輯之後再拔除
      if (isCreate.value) {
        selectedAgent.value = [];
      }
      if (!isCreate.value) {
        getProjectInfo();
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
.ProjectSettingModal {
  .project-name-box {
    position: relative;
    display: flex;
    align-items: center;
    .custom-input.useAiGenerate {
      padding-top: 0.85rem;
      padding-bottom: 0.85rem;
    }
    .useAiGenerate-btn {
      position: absolute;
      right: 4px;
    }
  }
  .useAngent-box {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 14px;

    > div {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background-color: var(--color-background-1);
      border-radius: 8px;
      i {
        cursor: pointer;
        font-size: 17px;
      }
    }
  }
  .project-cover-image-box {
    width: 100%;
    height: 235.58px;

    img {
      object-position: 50% 50%;
      object-fit: cover;
      width: 100%;
      height: 100%;
      border-radius: 16px;
    }
  }
  .project-upload-image-box {
    position: relative;
    margin-top: 8px;
    > input[type="file"] {
      // position: absolute;
      // top: 0;
      // left: 0;
      // width: 100%;
      // height: 100%;
      // opacity: 0;
      // cursor: pointer;
    }
  }
  .remark {
    color: var(--color-text-alpha50);
    font-size: 14px;
    margin-top: 10px;
  }
}
</style>
