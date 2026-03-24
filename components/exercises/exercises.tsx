"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/shared/loader";
import { ConfirmModal } from "@/components/shared/confirm-modal";

import { useListCategories } from "./api/use-list-categories";
import { useListExercises } from "./api/use-list-exercises";
import { useCreateCategory } from "./api/use-create-category";
import { useCreateExercise } from "./api/use-create-exercise";
import { useDeleteCategories } from "./api/use-delete-categories";
import { useDeleteExercises } from "./api/use-delete-exercises";
import { ExercisesSearchInput } from "./exercises-search";
import { useExercisesSearch } from "./hooks/use-exercises-search";
import { ExercisesCategoryList } from "./exercises-category-list";
import type { ExerciseUnitType } from "@/app/api/exercises/types";

import { normalizeForComparison } from "@/lib/normalize-string";
import type { IExercise, IExerciseCategory } from "@/app/api/exercises/types";
import CenterWrapper from "../shared/center-wrapper";

export const Exercises = () => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newExerciseByCategory, setNewExerciseByCategory] = useState<
    Record<string, string>
  >({});
  const [newExerciseUnitByCategory, setNewExerciseUnitByCategory] = useState<
    Record<string, ExerciseUnitType | "">
  >({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
    new Set()
  );
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<{
    open: boolean;
    categoryId: string | null;
  }>({ open: false, categoryId: null });
  const [deleteExerciseModal, setDeleteExerciseModal] = useState<{
    open: boolean;
    exerciseId: string | null;
  }>({ open: false, exerciseId: null });
  const [deleteSelectedModalOpen, setDeleteSelectedModalOpen] = useState(false);
  const [multiDeleteMode, setMultiDeleteMode] = useState(false);
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const { data: categoriesData, isLoading: loadingCategories } =
    useListCategories();
  const { data: exercisesData, isLoading: loadingExercises } =
    useListExercises();

  const { mutate: createCategory, isPending: isCreatingCategory } =
    useCreateCategory({
      onSuccess: () => setNewCategoryName(""),
      onError: (msg) => console.error(msg),
    });
  const { mutate: createExercise, isPending: isCreatingExercise } =
    useCreateExercise({
      onError: (msg) => console.error(msg),
    });
  const { mutate: deleteCategories, isPending: isDeletingCategories } =
    useDeleteCategories({
      onSuccess: () => {
        setDeletingCategoryId(null);
        setSelectedCategoryIds(new Set());
        setSelectedExerciseIds(new Set());
      },
    });
  const { mutate: deleteExercises, isPending: isDeletingExercises } =
    useDeleteExercises({
      onSuccess: () => {
        setDeletingExerciseId(null);
        setSelectedExerciseIds(new Set());
      },
    });

  const categories = useMemo(
    () => categoriesData?.categories ?? [],
    [categoriesData?.categories]
  );
  const exercises = useMemo(
    () => exercisesData?.exercises ?? [],
    [exercisesData?.exercises]
  );

  const exercisesByCategory = useMemo(() => {
    const map: Record<string, IExercise[]> = {};
    for (const ex of exercises) {
      if (!map[ex.category_id]) map[ex.category_id] = [];
      map[ex.category_id].push(ex);
    }
    return map;
  }, [exercises]);

  const {
    search,
    setSearch,
    searchLower,
    filteredCategories,
    expandedIds,
    toggleExpanded,
  } = useExercisesSearch({ categories, exercisesByCategory });

  const toggleCategorySelection = (id: string) => {
    const categoryExercises = exercisesByCategory[id] ?? [];
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      const willSelect = !next.has(id);
      if (willSelect) next.add(id);
      else next.delete(id);
      setSelectedExerciseIds((prevEx) => {
        const nextEx = new Set(prevEx);
        if (willSelect) categoryExercises.forEach((ex) => nextEx.add(ex.id));
        else categoryExercises.forEach((ex) => nextEx.delete(ex.id));
        return nextEx;
      });
      return next;
    });
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const nameNorm = normalizeForComparison(name);
    if (
      categories.some(
        (c: IExerciseCategory) => normalizeForComparison(c.name) === nameNorm
      )
    ) {
      toast.warning("A category with this name already exists.");
      return;
    }
    createCategory({ name });
  };

  const handleAddExercise = (categoryId: string) => {
    const name = (newExerciseByCategory[categoryId] ?? "").trim();
    const unitType = newExerciseUnitByCategory[categoryId] ?? "";
    if (!name || !unitType) return;
    const nameNorm = normalizeForComparison(name);
    if (
      exercises.some(
        (e: IExercise) => normalizeForComparison(e.name ?? "") === nameNorm
      )
    ) {
      toast.warning("An exercise with this name already exists.");
      return;
    }
    createExercise(
      { name, categoryId, unitType },
      {
        onSuccess: () => {
          setNewExerciseByCategory((prev) => ({ ...prev, [categoryId]: "" }));
          setNewExerciseUnitByCategory((prev) => ({
            ...prev,
            [categoryId]: "",
          }));
        },
      }
    );
  };

  const handleDeleteSelected = () => {
    const catIds = Array.from(selectedCategoryIds);
    const exIds = Array.from(selectedExerciseIds);
    if (catIds.length > 0) deleteCategories(catIds);
    if (exIds.length > 0) deleteExercises(exIds);
    setDeleteSelectedModalOpen(false);
  };

  const hasSelection =
    selectedCategoryIds.size > 0 || selectedExerciseIds.size > 0;
  const isDeleting = isDeletingCategories || isDeletingExercises;

  if (loadingCategories || loadingExercises) {
    return (
      <CenterWrapper className="flex w-full min-h-[50vh] items-center justify-center xl:w-1/2">
        <Loader />
      </CenterWrapper>
    );
  }

  return (
    <div className="flex w-full xl:w-1/2 flex-col gap-4">
      <div className="flex flex-col gap-2 border-b-2 border-primary-element pb-4">
        <ExercisesSearchInput value={search} onChange={setSearch} />
      </div>

      <div className="flex flex-col gap-2">
        <Input
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          disabled={isCreatingCategory}
          className="w-full"
        />
        <Button
          size="sm"
          className="w-full"
          onClick={handleAddCategory}
          variant="outline"
          disabled={!newCategoryName.trim() || isCreatingCategory}
        >
          {isCreatingCategory ? (
            <Loader size={16} />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add category
            </>
          )}
        </Button>
      </div>

      <div className="flex justify-end pr-1 -my-2">
        <Button
          type="button"
          variant="showHide"
          size="showHide"
          onClick={() => {
            setMultiDeleteMode((prev) => {
              if (prev) {
                setSelectedCategoryIds(new Set());
                setSelectedExerciseIds(new Set());
                return false;
              }
              return true;
            });
          }}
        >
          {multiDeleteMode ? "Hide multi-delete" : "Show multi-delete"}
        </Button>
      </div>

      {multiDeleteMode && hasSelection && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteSelectedModalOpen(true)}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader size={16} /> : <Trash2 className="h-4 w-4" />}
          Delete selected ({selectedCategoryIds.size + selectedExerciseIds.size}
          )
        </Button>
      )}

      <div className="border rounded-lg divide-y bg-card">
        <ExercisesCategoryList
          categories={filteredCategories}
          hasAnyCategories={categories.length > 0}
          expandedIds={expandedIds}
          multiDeleteMode={multiDeleteMode}
          selectedCategoryIds={selectedCategoryIds}
          selectedExerciseIds={selectedExerciseIds}
          searchLower={searchLower}
          newExerciseByCategory={newExerciseByCategory}
          newExerciseUnitByCategory={newExerciseUnitByCategory}
          isCreatingExercise={isCreatingExercise}
          deletingExerciseId={deletingExerciseId}
          deletingCategoryId={deletingCategoryId}
          onToggleExpanded={toggleExpanded}
          onToggleCategorySelection={toggleCategorySelection}
          onToggleExerciseSelection={(id) =>
            setSelectedExerciseIds((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
          onOpenDeleteCategory={(id) =>
            setDeleteCategoryModal({ open: true, categoryId: id })
          }
          onOpenDeleteExercise={(id) =>
            setDeleteExerciseModal({ open: true, exerciseId: id })
          }
          onAddExercise={handleAddExercise}
          onNewExerciseNameChange={(categoryId, value) =>
            setNewExerciseByCategory((prev) => ({
              ...prev,
              [categoryId]: value,
            }))
          }
          onNewExerciseUnitChange={(categoryId, value) =>
            setNewExerciseUnitByCategory((prev) => ({
              ...prev,
              [categoryId]: value,
            }))
          }
        />
      </div>

      <ConfirmModal
        open={deleteCategoryModal.open}
        onOpenChange={(open) =>
          !open && setDeleteCategoryModal({ open: false, categoryId: null })
        }
        title="Delete category?"
        description="This will permanently delete this category and all exercises in it. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteCategoryModal.categoryId) {
            setDeletingCategoryId(deleteCategoryModal.categoryId);
            deleteCategories([deleteCategoryModal.categoryId]);
            setDeleteCategoryModal({ open: false, categoryId: null });
          }
        }}
        isPending={isDeletingCategories}
      />

      <ConfirmModal
        open={deleteExerciseModal.open}
        onOpenChange={(open) =>
          !open && setDeleteExerciseModal({ open: false, exerciseId: null })
        }
        title="Delete exercise?"
        description="This will permanently delete this exercise. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteExerciseModal.exerciseId) {
            setDeletingExerciseId(deleteExerciseModal.exerciseId);
            deleteExercises([deleteExerciseModal.exerciseId]);
            setDeleteExerciseModal({ open: false, exerciseId: null });
          }
        }}
        isPending={isDeletingExercises}
      />

      <ConfirmModal
        open={deleteSelectedModalOpen}
        onOpenChange={setDeleteSelectedModalOpen}
        title="Delete selected?"
        description="This will permanently delete the selected categories and exercises. Categories will be deleted with all their exercises. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        cancelLabel="Cancel"
        onConfirm={handleDeleteSelected}
        isPending={isDeleting}
      />
    </div>
  );
};
