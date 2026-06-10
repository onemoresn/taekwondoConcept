import {
  markRequirementAttempted,
  parentVerifyProgress,
  instructorReviewProgress,
} from './workflowService';
import { notifyWorkflowEvent } from './notificationService';
import { isDemoAuthMode } from '../lib/authConfig';
import { supabase } from '../lib/supabaseClient';

const DEMO_PARENT_ID = 'demo-parent-id';
const DEMO_INSTRUCTOR_ID = 'demo-instructor-id';

async function getParentIdsForStudent(studentId) {
  if (isDemoAuthMode()) {
    return [DEMO_PARENT_ID];
  }
  const { data } = await supabase
    .from('parent_student_links')
    .select('parent_id')
    .eq('student_id', studentId);
  return (data ?? []).map((r) => r.parent_id);
}

async function getInstructorIdsForStudent(studentId) {
  if (isDemoAuthMode()) {
    return [DEMO_INSTRUCTOR_ID];
  }
  const { data } = await supabase
    .from('instructor_students')
    .select('instructor_id')
    .eq('student_id', studentId);
  return (data ?? []).map((r) => r.instructor_id);
}

export async function studentMarkAttempted({
  studentId,
  studentName,
  beltName,
  requirementId,
  requirementSlug,
  requirementTitle,
  note,
}) {
  const result = await markRequirementAttempted(studentId, requirementId, requirementSlug, note);
  const parentIds = await getParentIdsForStudent(studentId);
  if (parentIds.length) {
    await notifyWorkflowEvent({
      event: 'attempted',
      studentName,
      requirementTitle: requirementTitle ?? result.requirement_title,
      beltName,
      recipientUserIds: parentIds,
      linkPath: '/parent/verify',
    });
  }
  return result;
}

export async function parentVerify({
  progressId,
  verified,
  note,
  studentId,
  studentName,
  requirementTitle,
  beltName,
}) {
  const result = await parentVerifyProgress(progressId, verified, note);
  if (verified) {
    const instructorIds = await getInstructorIdsForStudent(studentId);
    if (instructorIds.length) {
      await notifyWorkflowEvent({
        event: 'parent_verified',
        studentName,
        requirementTitle,
        beltName,
        recipientUserIds: instructorIds,
        linkPath: '/instructor/reviews',
      });
    }
  }
  return result;
}

export async function instructorReview({
  progressId,
  approved,
  feedback,
  studentId,
  studentName,
  requirementTitle,
  beltName,
}) {
  const result = await instructorReviewProgress(progressId, approved, feedback);
  const parentIds = await getParentIdsForStudent(studentId);
  const recipients = [studentId, ...parentIds];
  await notifyWorkflowEvent({
    event: approved ? 'approved' : 'denied',
    studentName,
    requirementTitle,
    beltName,
    recipientUserIds: recipients,
    linkPath: approved ? '/student/progress' : '/student/training',
    feedback,
  });
  return result;
}
