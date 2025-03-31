import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { readFileAsDataURL } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setPosts } from '@/redux/postSlice';

const CreatePost = ({ open, setOpen }) => {
  const imageRef = useRef();

  const [postType, setPostType] = useState("image"); // image | text
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useSelector(store => store.auth);
  const { posts } = useSelector(store => store.post);
  const dispatch = useDispatch();

  // ================= FILE VALIDATION (STEP 5) =================
  const fileChangeHandler = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // ❌ block non-images (videos, etc.)
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Only image files are allowed (no videos)");
      e.target.value = null;
      return;
    }

    // ❌ block large images (>5MB)
    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error("Image must be under 5MB");
      e.target.value = null;
      return;
    }

    // ❌ block unsupported formats
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only JPG, PNG, or WEBP images allowed");
      e.target.value = null;
      return;
    }

    setFile(selectedFile);
    const preview = await readFileAsDataURL(selectedFile);
    setImagePreview(preview);
  };

  // ================= CREATE POST =================
  const createPostHandler = async () => {
    const formData = new FormData();
    formData.append("type", postType);

    // TEXT POST VALIDATION
    if (postType === "text") {
      if (!caption.trim()) {
        return toast.error("Text post cannot be empty");
      }
      formData.append("text", caption.trim());
    }

    // IMAGE POST VALIDATION
    if (postType === "image") {
      if (!file) {
        return toast.error("Please select an image");
      }
      formData.append("caption", caption);
      formData.append("image", file);
    }

    try {
      setLoading(true);

      const res = await api.post(
        "/post/addpost",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        }
      );

      if (res.data.success) {
        dispatch(setPosts([res.data.post, ...posts]));
        toast.success(res.data.message);
        setOpen(false);
        setCaption("");
        setFile(null);
        setImagePreview("");
      }

    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={() => setOpen(false)}>
        <DialogHeader className="text-center font-semibold">
          Create New Post
        </DialogHeader>

        {/* USER INFO */}
        <div className="flex gap-3 items-center">
          <Avatar>
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <h1 className="font-semibold text-xs">{user?.username}</h1>
        </div>

        {/* POST TYPE TOGGLE */}
        <div className="flex gap-3 my-3">
          <Button
            variant={postType === "text" ? "default" : "outline"}
            onClick={() => {
              setPostType("text");
              setFile(null);
              setImagePreview("");
            }}
          >
            Text Post
          </Button>

          <Button
            variant={postType === "image" ? "default" : "outline"}
            onClick={() => setPostType("image")}
          >
            Image Post
          </Button>
        </div>

        {/* TEXTAREA */}
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={
            postType === "text"
              ? "Write a text post (max 280 chars)..."
              : "Write a caption..."
          }
          maxLength={postType === "text" ? 280 : undefined}
        />

        {postType === "text" && (
          <p className="text-right text-xs text-gray-500">
            {caption.length}/280
          </p>
        )}

        {/* IMAGE PREVIEW */}
        {postType === "image" && imagePreview && (
          <img
            src={imagePreview}
            className="w-full h-64 object-cover rounded-md"
            alt="preview"
          />
        )}

        {/* IMAGE PICKER */}
        {postType === "image" && (
          <>
            <input
              ref={imageRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={fileChangeHandler}
            />
            <Button
              onClick={() => imageRef.current.click()}
              className="mx-auto bg-[#0095F6]"
            >
              Select Image
            </Button>
          </>
        )}

        {/* SUBMIT */}
        <Button
          onClick={createPostHandler}
          disabled={loading}
          className="w-full mt-3"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Post"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePost;
